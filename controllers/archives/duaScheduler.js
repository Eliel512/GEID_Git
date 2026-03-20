/**
 * controllers/archives/duaScheduler.js
 *
 * Automatic DUA (Durée d'Utilité Administrative) lifecycle scheduler.
 *
 * Runs every hour and looks for SEMI_ACTIVE archives whose DUA has expired:
 *   dua.startDate + (dua.value × dua.unit) ≤ now
 *
 * On expiry, the archive is automatically transitioned to:
 *   - PERMANENT  if dua.sortFinal === 'conservation'
 *   - DESTROYED  if dua.sortFinal === 'elimination'
 *
 * A lifecycle history entry is added with note indicating auto-transition.
 *
 * IMPORTANT: In PM2 cluster mode, only instance 0 runs the scheduler to avoid
 * duplicate processing. Check NODE_APP_INSTANCE before calling start().
 */

const Archive = require('../../models/archives/archive.model');

const SEMI_ACTIVE_STATUSES = ['SEMI_ACTIVE', 'intermédiaire', 'archived'];

/**
 * Calculates the DUA expiration date.
 * @param {Date} startDate
 * @param {number} value
 * @param {'years'|'months'} unit
 * @returns {Date}
 */
function computeExpiresAt(startDate, value, unit) {
    const d = new Date(startDate);
    if (unit === 'years')  d.setFullYear(d.getFullYear() + value);
    if (unit === 'months') d.setMonth(d.getMonth() + value);
    return d;
}

/**
 * Runs a single pass of DUA expiry checks.
 * @returns {Promise<number>} number of archives transitioned
 */
async function processDuaTransitions() {
    const now = new Date();
    console.log(`[DUA Scheduler] Pass at ${now.toISOString()}`);

    try {
        const archives = await Archive.find({
            status: { $in: SEMI_ACTIVE_STATUSES },
            'dua.value':     { $exists: true, $ne: null },
            'dua.unit':      { $exists: true },
            'dua.sortFinal': { $exists: true },
            'dua.startDate': { $exists: true, $ne: null },
        }).lean();

        let count = 0;

        for (const archive of archives) {
            const { value, unit, sortFinal, startDate } = archive.dua || {};
            if (!startDate || !value || !unit || !sortFinal) continue;

            const expiresAt = computeExpiresAt(startDate, value, unit);
            if (now < expiresAt) continue;

            const targetStatus = sortFinal === 'conservation' ? 'PERMANENT' : 'DESTROYED';
            const label = sortFinal === 'conservation'
                ? 'conservation → PERMANENT'
                : 'élimination → DESTROYED';

            await Archive.findByIdAndUpdate(
                archive._id,
                {
                    $set: {
                        status:    targetStatus,
                        validated: targetStatus !== 'DESTROYED',
                    },
                    $push: {
                        lifecycleHistory: {
                            status:    targetStatus,
                            changedAt: now,
                            changedBy: null,
                            note: `DUA expirée (${value} ${unit}) — transition automatique ${label}`,
                        },
                    },
                },
                { runValidators: false }
            );

            count++;
            console.log(`[DUA Scheduler] ${archive._id} → ${targetStatus} (${label})`);
        }

        if (count > 0) console.log(`[DUA Scheduler] ${count} archive(s) transitioned.`);
        return count;
    } catch (err) {
        console.error('[DUA Scheduler] Error during processing:', err);
        return 0;
    }
}

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
let intervalHandle = null;

module.exports = {
    /**
     * Starts the scheduler. Call once per process (not per request).
     * Guard with NODE_APP_INSTANCE === '0' in PM2 cluster mode.
     */
    start() {
        console.log('[DUA Scheduler] Started — interval: 1 hour.');
        processDuaTransitions(); // immediate first pass
        intervalHandle = setInterval(processDuaTransitions, CHECK_INTERVAL_MS);
    },

    stop() {
        if (intervalHandle) clearInterval(intervalHandle);
        intervalHandle = null;
    },

    // Exported for unit testing
    processDuaTransitions,
    computeExpiresAt,
};

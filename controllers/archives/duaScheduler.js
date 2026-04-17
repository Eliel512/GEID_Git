/**
 * controllers/archives/duaScheduler.js
 *
 * Scheduler automatique du cycle de vie des archives (Directives DANTIC).
 *
 * MODELE PAR PHASE :
 *   ACTIVE       --DUA active expire-->    SEMI_ACTIVE      (auto, sans validation humaine)
 *   SEMI_ACTIVE  --DUA semi expire-->      PERMANENT        (si sortFinal=conservation)
 *                                        ou PROPOSED_ELIM  (si sortFinal=elimination — PV humain requis)
 *
 * Compat legacy : les archives SEMI_ACTIVE qui n'ont que dua.value/unit/startDate
 * (ancien modele single-DUA) sont traitees comme dua.semiActive.
 */

const Archive = require('../../models/archives/archive.model');

const ACTIVE_STATUSES      = ['ACTIVE', 'actif', 'validated'];
const SEMI_ACTIVE_STATUSES = ['SEMI_ACTIVE', 'intermédiaire', 'archived'];

const CHECK_INTERVAL_MS = Number(process.env.DUA_CHECK_INTERVAL_MS) || 60 * 60 * 1000; // 1h
const GRACE_PERIOD_DAYS = Number(process.env.DUA_GRACE_PERIOD_DAYS) || 0;

function computeExpiresAt(startDate, value, unit) {
    const d = new Date(startDate);
    if (unit === 'years')  d.setFullYear(d.getFullYear() + value);
    if (unit === 'months') d.setMonth(d.getMonth() + value);
    if (unit === 'days')   d.setDate(d.getDate() + value);
    return d;
}

/** Retourne la DUA effective d'une phase, avec fallback legacy. */
function phaseDua(archive, phase) {
    const d = archive.dua || {};
    if (phase === 'active') {
        if (d.active?.startDate && d.active?.value && d.active?.unit) {
            return { value: d.active.value, unit: d.active.unit, startDate: d.active.startDate };
        }
        return null;
    }
    // semiActive : preferer dua.semiActive, fallback sur dua top-level (legacy)
    if (d.semiActive?.startDate && d.semiActive?.value && d.semiActive?.unit) {
        return { value: d.semiActive.value, unit: d.semiActive.unit, startDate: d.semiActive.startDate };
    }
    if (d.startDate && d.value && d.unit) {
        return { value: d.value, unit: d.unit, startDate: d.startDate };
    }
    return null;
}

async function processDuaTransitions() {
    const now = new Date();
    console.log(`[DUA Scheduler] Vérification à ${now.toISOString()}`);

    let countToSemi = 0;
    let countToPermanent = 0;
    let countToProposed  = 0;

    try {
        // ── 1. ACTIVE -> SEMI_ACTIVE ──────────────────────────
        const actives = await Archive.find({
            status: { $in: ACTIVE_STATUSES },
            'dua.active.startDate': { $exists: true, $ne: null },
            'dua.active.value':     { $exists: true, $ne: null },
            'dua.active.unit':      { $exists: true },
        }).lean();

        for (const archive of actives) {
            const d = phaseDua(archive, 'active');
            if (!d) continue;
            const expiresAt = computeExpiresAt(d.startDate, d.value, d.unit);
            if (now < expiresAt) continue;

            const setFields = {
                status: 'SEMI_ACTIVE',
                validated: true,
                'dua.semiActive.startDate': now,
            };
            if (archive.dua?.semiActive?.value == null) setFields['dua.semiActive.value'] = 10;
            if (!archive.dua?.semiActive?.unit)         setFields['dua.semiActive.unit'] = 'years';
            if (!archive.dua?.sortFinal)                setFields['dua.sortFinal'] = 'conservation';
            // Compat legacy
            setFields['dua.value']     = archive.dua?.semiActive?.value ?? 10;
            setFields['dua.unit']      = archive.dua?.semiActive?.unit ?? 'years';
            setFields['dua.startDate'] = now;

            await Archive.findByIdAndUpdate(archive._id, {
                $set: setFields,
                $push: {
                    lifecycleHistory: {
                        status: 'SEMI_ACTIVE',
                        changedAt: now,
                        changedBy: null,
                        note: `Transition automatique — phase active expirée (${d.value} ${d.unit}). Démarrage de la phase intermédiaire.`,
                    },
                },
            }, { runValidators: false });
            countToSemi++;
            console.log(`[DUA] ${archive._id} : ACTIVE → SEMI_ACTIVE`);
        }

        // ── 2. SEMI_ACTIVE -> PERMANENT ou PROPOSED_ELIMINATION ──
        const semis = await Archive.find({
            status: { $in: SEMI_ACTIVE_STATUSES },
        }).lean();

        for (const archive of semis) {
            const d = phaseDua(archive, 'semiActive');
            if (!d) continue;
            const sortFinal = archive.dua?.sortFinal ?? 'conservation';

            const expiresAt = computeExpiresAt(d.startDate, d.value, d.unit);
            const graceDate = new Date(expiresAt);
            graceDate.setDate(graceDate.getDate() + GRACE_PERIOD_DAYS);

            if (now < expiresAt) continue;

            if (sortFinal === 'conservation') {
                if (now < graceDate) continue;
                await Archive.findByIdAndUpdate(archive._id, {
                    $set: { status: 'PERMANENT', validated: true },
                    $push: {
                        lifecycleHistory: {
                            status: 'PERMANENT',
                            changedAt: now,
                            changedBy: null,
                            note: `Transition automatique — phase intermédiaire expirée (${d.value} ${d.unit}). Conservation définitive (Directive 21).`,
                        },
                    },
                }, { runValidators: false });
                countToPermanent++;
                console.log(`[DUA] ${archive._id} : SEMI_ACTIVE → PERMANENT`);
            } else if (sortFinal === 'elimination') {
                await Archive.findByIdAndUpdate(archive._id, {
                    $set: { status: 'PROPOSED_ELIMINATION', validated: false },
                    $push: {
                        lifecycleHistory: {
                            status: 'PROPOSED_ELIMINATION',
                            changedAt: now,
                            changedBy: null,
                            note: `Proposition d'élimination automatique — phase intermédiaire expirée (${d.value} ${d.unit}). En attente de PV (Directive 23).`,
                        },
                    },
                }, { runValidators: false });
                countToProposed++;
                console.log(`[DUA] ${archive._id} : SEMI_ACTIVE → PROPOSED_ELIMINATION`);
            }
        }

        const total = countToSemi + countToPermanent + countToProposed;
        if (total > 0) {
            console.log(`[DUA Scheduler] ${countToSemi} → intermédiaire, ${countToPermanent} → historique, ${countToProposed} → proposition élimination.`);
        }
        return total;
    } catch (err) {
        console.error('[DUA Scheduler] Erreur :', err);
        return 0;
    }
}

let intervalHandle = null;

module.exports = {
    start() {
        console.log(`[DUA Scheduler] Démarré — intervalle : ${CHECK_INTERVAL_MS / 60000} min, grâce : ${GRACE_PERIOD_DAYS} jour(s).`);
        processDuaTransitions();
        intervalHandle = setInterval(processDuaTransitions, CHECK_INTERVAL_MS);
    },
    stop() {
        if (intervalHandle) clearInterval(intervalHandle);
        intervalHandle = null;
    },
    processDuaTransitions,
    computeExpiresAt,
    phaseDua,
};

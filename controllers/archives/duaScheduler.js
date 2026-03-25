/**
 * controllers/archives/duaScheduler.js
 *
 * Scheduler automatique du cycle de vie des archives (aligné sur les Directives DANTIC).
 *
 * Toutes les heures, vérifie les archives dont la DUA a expiré :
 *
 *   1. SEMI_ACTIVE + DUA expirée + sortFinal="conservation"
 *      → Transition automatique vers PERMANENT (conservation définitive)
 *
 *   2. SEMI_ACTIVE + DUA expirée + sortFinal="elimination"
 *      → Transition vers PROPOSED_ELIMINATION (proposition d'élimination)
 *      → Un archiviste doit valider manuellement la destruction (Directive 23)
 *      → Après le délai de grâce sans intervention → reste en PROPOSED_ELIMINATION
 *        (PAS de destruction automatique — conformité Directive 23 : PV obligatoire)
 *
 * L'intervention humaine reste possible à tout moment :
 *   - Bloquer une transition en modifiant la DUA
 *   - Réactiver une archive intermédiaire
 *   - Valider ou refuser une élimination proposée
 *
 * PARAMÈTRES AJUSTABLES (via env ou constantes) :
 *   - CHECK_INTERVAL_MS : fréquence de vérification (défaut 1h)
 *   - GRACE_PERIOD_DAYS : jours d'alerte avant transition auto conservation (défaut 0)
 */

const Archive = require('../../models/archives/archive.model');

const SEMI_ACTIVE_STATUSES = ['SEMI_ACTIVE', 'intermédiaire', 'archived'];

// Paramètres ajustables
const CHECK_INTERVAL_MS  = Number(process.env.DUA_CHECK_INTERVAL_MS)  || 60 * 60 * 1000; // 1h
const GRACE_PERIOD_DAYS  = Number(process.env.DUA_GRACE_PERIOD_DAYS)  || 0;

/**
 * Calcule la date d'expiration de la DUA.
 */
function computeExpiresAt(startDate, value, unit) {
    const d = new Date(startDate);
    if (unit === 'years')  d.setFullYear(d.getFullYear() + value);
    if (unit === 'months') d.setMonth(d.getMonth() + value);
    if (unit === 'days')   d.setDate(d.getDate() + value);
    return d;
}

/**
 * Passage unique de vérification des DUA expirées.
 */
async function processDuaTransitions() {
    const now = new Date();
    console.log(`[DUA Scheduler] Vérification à ${now.toISOString()}`);

    try {
        // ── 1. Archives SEMI_ACTIVE dont la DUA a expiré ─────────────
        const archives = await Archive.find({
            status: { $in: SEMI_ACTIVE_STATUSES },
            'dua.value':     { $exists: true, $ne: null },
            'dua.unit':      { $exists: true },
            'dua.sortFinal': { $exists: true },
            'dua.startDate': { $exists: true, $ne: null },
        }).lean();

        let countConservation = 0;
        let countProposedElim = 0;

        for (const archive of archives) {
            const { value, unit, sortFinal, startDate } = archive.dua || {};
            if (!startDate || !value || !unit || !sortFinal) continue;

            const expiresAt = computeExpiresAt(startDate, value, unit);

            // Délai de grâce pour conservation
            const graceDate = new Date(expiresAt);
            graceDate.setDate(graceDate.getDate() + GRACE_PERIOD_DAYS);

            if (now < expiresAt) continue; // DUA pas encore expirée

            if (sortFinal === 'conservation') {
                // Conservation : transition automatique vers PERMANENT après le délai de grâce
                if (now < graceDate) continue; // Encore dans le délai de grâce

                await Archive.findByIdAndUpdate(archive._id, {
                    $set: { status: 'PERMANENT', validated: true },
                    $push: {
                        lifecycleHistory: {
                            status: 'PERMANENT',
                            changedAt: now,
                            changedBy: null,
                            note: `Transition automatique — DUA expirée (${value} ${unit}). Conservation définitive conformément à la Directive 21.`,
                        },
                    },
                }, { runValidators: false });

                countConservation++;
                console.log(`[DUA] ${archive._id} → PERMANENT (conservation automatique)`);

            } else if (sortFinal === 'elimination') {
                // Élimination : NE PAS détruire automatiquement (Directive 23)
                // Proposer l'élimination — un archiviste doit valider avec PV
                await Archive.findByIdAndUpdate(archive._id, {
                    $set: { status: 'PROPOSED_ELIMINATION', validated: false },
                    $push: {
                        lifecycleHistory: {
                            status: 'PROPOSED_ELIMINATION',
                            changedAt: now,
                            changedBy: null,
                            note: `Proposition d'élimination automatique — DUA expirée (${value} ${unit}). En attente de validation par un archiviste (Directive 23 : PV et bordereau d'élimination requis).`,
                        },
                    },
                }, { runValidators: false });

                countProposedElim++;
                console.log(`[DUA] ${archive._id} → PROPOSED_ELIMINATION (en attente de PV)`);
            }
        }

        const total = countConservation + countProposedElim;
        if (total > 0) {
            console.log(`[DUA Scheduler] ${countConservation} conservation(s), ${countProposedElim} proposition(s) d'élimination.`);
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
        console.log(`[DUA Scheduler] Démarré — intervalle : ${CHECK_INTERVAL_MS / 60000} minutes, grâce : ${GRACE_PERIOD_DAYS} jours.`);
        processDuaTransitions();
        intervalHandle = setInterval(processDuaTransitions, CHECK_INTERVAL_MS);
    },
    stop() {
        if (intervalHandle) clearInterval(intervalHandle);
        intervalHandle = null;
    },
    processDuaTransitions,
    computeExpiresAt,
};

/**
 * controllers/archives/dua.js
 *
 * PUT /api/stuff/archives/:id/dua
 *
 * Configure ou met a jour la DUA par phase (active + semiActive + sortFinal).
 *
 * Body accepte (compat : ancien format lu comme semiActive) :
 *   {
 *     active:     { value, unit }?        // phase active (defaut 10 ans/years)
 *     semiActive: { value, unit }?        // phase intermediaire (defaut 10 ans/years)
 *     sortFinal:  'conservation' | 'elimination'
 *     // Ancien format (retro-compat) :
 *     value, unit   // traites comme semiActive
 *   }
 *
 * Les startDate ne sont PAS modifiables via cet endpoint :
 *   - dua.active.startDate est posee a la validation ou lors d'une transition ACTIVE
 *   - dua.semiActive.startDate est posee au passage SEMI_ACTIVE
 */

const Archive = require('../../models/archives/archive.model');
const { computeExpiresAt } = require('./duaScheduler');

function validDuration(obj) {
    if (!obj) return null;
    const value = Number(obj.value);
    if (!value || value <= 0) return null;
    if (!['years', 'months'].includes(obj.unit)) return null;
    return { value, unit: obj.unit };
}

module.exports = async (req, res) => {
    const { active, semiActive, sortFinal } = req.body;

    // Compat : ancien format { value, unit } traite comme semiActive
    const legacy = req.body.value != null
        ? validDuration({ value: req.body.value, unit: req.body.unit })
        : null;
    const semiIn = validDuration(semiActive) ?? legacy;
    const activeIn = validDuration(active);

    if (!semiIn && !activeIn) {
        return res.status(400).json({
            error: "Au moins une phase (active ou semiActive) doit être fournie avec value + unit.",
        });
    }
    if (sortFinal !== undefined && !['conservation', 'elimination'].includes(sortFinal)) {
        return res.status(400).json({ error: "sortFinal doit etre 'conservation' ou 'elimination'." });
    }

    try {
        const archive = await Archive.findById(req.params.id);
        if (!archive) return res.status(404).json({ error: 'Archive introuvable.' });

        const setFields = {};
        if (activeIn) {
            setFields['dua.active.value'] = activeIn.value;
            setFields['dua.active.unit']  = activeIn.unit;
        }
        if (semiIn) {
            setFields['dua.semiActive.value'] = semiIn.value;
            setFields['dua.semiActive.unit']  = semiIn.unit;
            // Compat legacy
            setFields['dua.value'] = semiIn.value;
            setFields['dua.unit']  = semiIn.unit;
        }
        if (sortFinal !== undefined) setFields['dua.sortFinal'] = sortFinal;

        const updated = await Archive.findByIdAndUpdate(
            req.params.id,
            { $set: setFields },
            { new: true, runValidators: false }
        );

        // Dates d'expiration calculees pour affichage client
        const expiresActive = updated.dua?.active?.startDate && updated.dua?.active?.value
            ? computeExpiresAt(updated.dua.active.startDate, updated.dua.active.value, updated.dua.active.unit)
            : null;
        const expiresSemi = updated.dua?.semiActive?.startDate && updated.dua?.semiActive?.value
            ? computeExpiresAt(updated.dua.semiActive.startDate, updated.dua.semiActive.value, updated.dua.semiActive.unit)
            : null;

        res.status(200).json({
            ...updated.toObject(),
            duaExpiresAt: expiresSemi ?? expiresActive, // compat (ancien champ)
            duaActiveExpiresAt: expiresActive,
            duaSemiActiveExpiresAt: expiresSemi,
        });
    } catch (err) {
        console.error('[dua]', err);
        res.status(500).json({ error: 'Une erreur est survenue.' });
    }
};

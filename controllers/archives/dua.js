/**
 * controllers/archives/dua.js
 *
 * PUT /api/stuff/archives/:id/dua
 *
 * Configure or update the DUA (Durée d'Utilité Administrative) parameters
 * for an archive. The archive must exist and the caller must have write access.
 *
 * Body: {
 *   value:     number      — DUA duration (e.g., 5)
 *   unit:      'years' | 'months'
 *   sortFinal: 'conservation' | 'elimination'
 * }
 *
 * If the archive is already in SEMI_ACTIVE and has no startDate yet,
 * startDate is set to now automatically.
 */

const Archive = require('../../models/archives/archive.model');
const { computeExpiresAt } = require('./duaScheduler');

const SEMI_ACTIVE_STATUSES = new Set(['SEMI_ACTIVE', 'intermédiaire', 'archived']);

module.exports = async (req, res) => {
    const { value, unit, sortFinal } = req.body;

    const numValue = Number(value);
    if (!numValue || numValue <= 0) {
        return res.status(400).json({ error: 'value must be a positive number.' });
    }
    if (!['years', 'months'].includes(unit)) {
        return res.status(400).json({ error: "unit must be 'years' or 'months'." });
    }
    if (!['conservation', 'elimination'].includes(sortFinal)) {
        return res.status(400).json({ error: "sortFinal must be 'conservation' or 'elimination'." });
    }

    try {
        const archive = await Archive.findById(req.params.id);
        if (!archive) return res.status(404).json({ error: 'Archive not found.' });

        const setFields = {
            'dua.value':     numValue,
            'dua.unit':      unit,
            'dua.sortFinal': sortFinal,
        };

        // Auto-set startDate if the archive is SEMI_ACTIVE and has none yet
        const currentStatus = archive.status;
        if (SEMI_ACTIVE_STATUSES.has(currentStatus) && !archive.dua?.startDate) {
            setFields['dua.startDate'] = new Date();
        }

        const updated = await Archive.findByIdAndUpdate(
            req.params.id,
            { $set: setFields },
            { new: true, runValidators: false }
        );

        // Compute and return the expiry date for client display
        const startDate = updated.dua?.startDate;
        const expiresAt = startDate ? computeExpiresAt(startDate, numValue, unit) : null;

        res.status(200).json({ ...updated.toObject(), duaExpiresAt: expiresAt });
    } catch (err) {
        console.error('[dua]', err);
        res.status(500).json({ error: 'An error occurred.' });
    }
};

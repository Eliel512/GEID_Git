const Archive = require('../../models/archives/archive.model');

const DEFAULT_YEARS = 10;

module.exports = async (req, res) => {
    try {
        const archive = await Archive.findById(req.body.id);
        if (!archive) return res.status(404).json({ message: 'Archive introuvable' });

        archive.classNumber = req.body.classNumber;
        archive.refNumber   = req.body.refNumber;
        archive.type.profil = res.locals.profil;
        archive.validated   = true;
        archive.status      = 'ACTIVE';

        // ── DUA par phase ──────────────────────────────────────────
        // Phase active : 10 ans, compte a rebours demarre MAINTENANT.
        // Phase intermediaire : 10 ans, compte a rebours demarrera au
        // passage SEMI_ACTIVE (declenche soit manuellement, soit par
        // le scheduler quand la phase active arrive a terme).
        if (!archive.dua) archive.dua = {};

        if (!archive.dua.active) archive.dua.active = {};
        if (archive.dua.active.value == null) archive.dua.active.value = DEFAULT_YEARS;
        if (!archive.dua.active.unit)         archive.dua.active.unit = 'years';
        if (!archive.dua.active.startDate)    archive.dua.active.startDate = new Date();

        if (!archive.dua.semiActive) archive.dua.semiActive = {};
        if (archive.dua.semiActive.value == null) archive.dua.semiActive.value = DEFAULT_YEARS;
        if (!archive.dua.semiActive.unit)         archive.dua.semiActive.unit = 'years';

        if (!archive.dua.sortFinal) archive.dua.sortFinal = 'conservation';

        // Compat : maintient les anciens champs top-level pour clients legacy
        archive.dua.value     = archive.dua.semiActive.value;
        archive.dua.unit      = archive.dua.semiActive.unit;
        archive.dua.startDate = archive.dua.active.startDate;

        archive.lifecycleHistory.push({
            status: 'ACTIVE',
            changedAt: new Date(),
            changedBy: res.locals.userId,
            note: 'Validation — DUA active 10 ans + intermédiaire 10 ans / conservation'
        });

        await archive.save();
        res.status(200).json(archive);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Une erreur est survenue' });
    }
};

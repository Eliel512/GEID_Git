const Archive = require('../../models/archives/archive.model');

module.exports = async (req, res) => {
    try {
        const archive = await Archive.findById(req.body.id);
        if (!archive) return res.status(404).json({ message: 'Archive introuvable' });

        archive.classNumber = req.body.classNumber;
        archive.refNumber   = req.body.refNumber;
        archive.type.profil = res.locals.profil;
        archive.validated   = true;
        archive.status      = 'ACTIVE';

        // DUA par defaut 10 ans / conservation — visible des l'etat ACTIVE.
        // startDate reste vide : le compte a rebours ne demarre qu'au passage SEMI_ACTIVE.
        if (!archive.dua) archive.dua = {};
        if (archive.dua.value == null) archive.dua.value = 10;
        if (!archive.dua.unit)         archive.dua.unit = 'years';
        if (!archive.dua.sortFinal)    archive.dua.sortFinal = 'conservation';

        archive.lifecycleHistory.push({
            status: 'ACTIVE',
            changedAt: new Date(),
            changedBy: res.locals.userId,
            note: 'Validation — promoted to ACTIVE (current archives)'
        });

        await archive.save();
        res.status(200).json(archive);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Une erreur est survenue' });
    }
};

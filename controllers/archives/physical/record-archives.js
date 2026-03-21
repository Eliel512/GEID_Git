'use strict';

/**
 * controllers/archives/physical/record-archives.js
 *
 * Contrôleur — Archives numériques rattachées à un document physique (Record)
 *
 * Endpoint : GET /api/stuff/archives/physical/records/:id/archives
 *
 * Retourne toutes les archives numériques dont le champ `record` correspond
 * à l'identifiant du dossier physique demandé. C'est le point de jonction
 * entre le monde physique (dossier cartonné) et le monde numérique (fichiers
 * archivés dans le système GED).
 *
 * Réponse :
 *   {
 *     record:   string,    // _id du dossier physique
 *     count:    number,    // nombre d'archives liées
 *     archives: Archive[]  // liste des archives avec leurs métadonnées
 *   }
 */

const Archive = require('../../../models/archives/archive.model');

module.exports = async (req, res) => {
    try {
        const recordId = req.params.id;

        const archives = await Archive
            .find({ record: recordId })
            .select('designation description folder classNumber refNumber status tags dua fileUrl validated createdAt updatedAt')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            record:   recordId,
            count:    archives.length,
            archives,
        });
    } catch (error) {
        console.error('[record-archives]', error);
        res.status(500).json({ error: 'Une erreur est survenue lors de la récupération des archives liées.' });
    }
};

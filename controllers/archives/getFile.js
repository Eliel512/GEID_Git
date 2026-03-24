'use strict';

/**
 * GET /api/stuff/archives/file/:id
 *
 * Sert le fichier associé à une archive de manière authentifiée.
 * Le client doit fournir un token JWT valide (middleware auth en amont).
 *
 * Lit depuis MinIO en priorité, filesystem en fallback.
 */

const path    = require('path');
const mime    = require('mime-types');
const Archive = require('../../models/archives/archive.model');
const storage = require('../../tools/storage');

module.exports = async (req, res) => {
    try {
        const archive = await Archive.findById(req.params.id, { fileUrl: 1 });
        if (!archive || !archive.fileUrl) {
            return res.status(404).json({ message: 'Archive ou fichier introuvable.' });
        }

        const relativePath = archive.fileUrl;
        const fileName     = path.basename(relativePath);
        const contentType  = mime.lookup(fileName) || 'application/octet-stream';

        // Headers — Content-Type, Content-Length, Content-Disposition
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
        const fileSize = await storage.getFileSize(relativePath);
        if (fileSize > 0) res.setHeader('Content-Length', fileSize);

        // Stream le fichier depuis MinIO (ou filesystem fallback)
        const stream = await storage.getFileStream(relativePath);
        stream.on('error', (err) => {
            console.error('[getFile] stream error:', err.message);
            if (!res.headersSent) {
                res.status(404).json({ message: 'Fichier introuvable sur le stockage.' });
            }
        });
        stream.pipe(res);

    } catch (error) {
        console.error('[getFile]', error);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Erreur lors de la lecture du fichier.' });
        }
    }
};

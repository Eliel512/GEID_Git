/**
 * serveThumbnail — Miniature d'un fichier archive via MinIO.
 *
 * GET /api/stuff/archives/thumbnail/:id
 * Stockage uniquement MinIO.
 */

'use strict';

const path = require('path');
const Archive = require('../../models/archives/archive.model');
const storage = require('../../tools/storage');
const { getThumbnail, isSupported } = require('../../tools/thumbnail');

module.exports = async (req, res) => {
	try {
		const archive = await Archive.findById(req.params.id, { fileUrl: 1 }).lean();
		if (!archive?.fileUrl) return res.status(404).json({ message: 'Archive introuvable.' });

		if (!isSupported(archive.fileUrl)) return res.status(204).end();

		res.setHeader('Cache-Control', 'public, max-age=86400');
		res.setHeader('Content-Type', 'image/webp');

		// Lire le fichier source
		let fileBuffer;
		if (storage.MINIO_ENABLED) {
			try {
				const chunks = [];
				const stream = await storage.getFileStream(archive.fileUrl);
				for await (const chunk of stream) chunks.push(chunk);
				fileBuffer = Buffer.concat(chunks);
			} catch { /* MinIO fail */ }
		}

		if (!fileBuffer) {
			const fs = require('fs');
			const mainDir = path.dirname(require.main.filename);
			const absPath = path.join(mainDir, archive.fileUrl);
			if (fs.existsSync(absPath)) {
				fileBuffer = fs.readFileSync(absPath);
			}
		}

		if (!fileBuffer) return res.status(204).end();

		const thumb = await getThumbnail(fileBuffer, path.basename(archive.fileUrl), archive.fileUrl);
		if (thumb) return res.end(thumb);

		res.status(204).end();
	} catch (err) {
		console.error('[archive:thumbnail]', err.message);
		res.status(204).end();
	}
};

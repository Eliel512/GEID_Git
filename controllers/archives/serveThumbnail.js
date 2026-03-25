/**
 * serveThumbnail — Miniature d'un fichier archive.
 *
 * GET /api/stuff/archives/thumbnail/:id
 * Retourne un webp 200x200 de l'archive ou 204 si non supporté.
 */

'use strict';

const path = require('path');
const fs = require('fs');
const Archive = require('../../models/archives/archive.model');
const storage = require('../../tools/storage');
const { generateThumbnail, generateThumbnailFromBuffer, IMAGE_EXTS, getExt } = require('../../tools/thumbnail');

module.exports = async (req, res) => {
	try {
		const archive = await Archive.findById(req.params.id, { fileUrl: 1 }).lean();
		if (!archive?.fileUrl) return res.status(404).json({ message: 'Archive introuvable.' });

		const ext = getExt(archive.fileUrl);
		if (!IMAGE_EXTS.has(ext)) return res.status(204).end();

		res.setHeader('Cache-Control', 'public, max-age=86400');
		res.setHeader('Content-Type', 'image/webp');

		// Filesystem
		const mainDir = path.dirname(require.main.filename);
		const absPath = path.join(mainDir, archive.fileUrl);
		if (fs.existsSync(absPath)) {
			const thumb = await generateThumbnail(absPath);
			if (thumb) return res.end(thumb.buffer);
		}

		// MinIO
		if (storage.MINIO_ENABLED) {
			try {
				const chunks = [];
				const stream = await storage.getFileStream(archive.fileUrl);
				for await (const chunk of stream) chunks.push(chunk);
				const thumb = await generateThumbnailFromBuffer(Buffer.concat(chunks), archive.fileUrl);
				if (thumb) return res.end(thumb.buffer);
			} catch { /* fallback */ }
		}

		res.status(204).end();
	} catch (err) {
		console.error('[archive:thumbnail]', err.message);
		res.status(204).end();
	}
};

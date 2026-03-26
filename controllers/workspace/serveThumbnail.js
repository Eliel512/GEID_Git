/**
 * serveThumbnail — Miniature d'un fichier workspace via MinIO.
 *
 * GET /api/stuff/workspace/thumbnail/:userId/category/file.ext
 *
 * Stockage uniquement MinIO — pas de fichiers locaux.
 */

'use strict';

const paths = require('path');
const storage = require('../../tools/storage');
const { getThumbnail, isSupported } = require('../../tools/thumbnail');

exports.serveThumbnail = async (req, res) => {
	const userId = res.locals.userId;
	const filePath = decodeURIComponent(req.params[0] || '');

	if (!filePath) return res.status(400).json({ message: 'Chemin invalide.' });

	const parts = filePath.split('/');
	if (parts[0] !== userId) return res.status(403).json({ message: 'Accès non autorisé.' });

	if (!isSupported(filePath)) return res.status(204).end();

	res.setHeader('Cache-Control', 'public, max-age=86400');
	res.setHeader('Content-Type', 'image/webp');

	try {
		const relPath = paths.join('workspace', filePath);

		// Lire le fichier source depuis MinIO (ou filesystem en fallback)
		let fileBuffer;
		if (storage.MINIO_ENABLED) {
			try {
				const chunks = [];
				const stream = await storage.getFileStream(relPath);
				for await (const chunk of stream) chunks.push(chunk);
				fileBuffer = Buffer.concat(chunks);
			} catch { /* MinIO fail — try fs */ }
		}

		if (!fileBuffer) {
			const fs = require('fs');
			const { WORKSPACE_BASE, safePath } = require('./utils');
			const absPath = safePath(WORKSPACE_BASE, filePath);
			if (absPath && fs.existsSync(absPath)) {
				fileBuffer = fs.readFileSync(absPath);
			}
		}

		if (!fileBuffer) return res.status(204).end();

		const thumb = await getThumbnail(fileBuffer, paths.basename(filePath), relPath);
		if (thumb) return res.end(thumb);

		res.status(204).end();
	} catch (err) {
		console.error('[serveThumbnail]', err.message);
		res.status(204).end();
	}
};

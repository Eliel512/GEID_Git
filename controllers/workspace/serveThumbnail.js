/**
 * serveThumbnail — Miniature d'un fichier workspace via MinIO uniquement.
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

		const chunks = [];
		const stream = await storage.getFileStream(relPath);
		for await (const chunk of stream) chunks.push(chunk);
		const fileBuffer = Buffer.concat(chunks);

		if (!fileBuffer || fileBuffer.length === 0) return res.status(204).end();

		const quality = req.query.quality || 'medium';
		const thumb = await getThumbnail(fileBuffer, paths.basename(filePath), relPath, quality);
		if (thumb) return res.end(thumb);

		res.status(204).end();
	} catch (err) {
		console.error('[serveThumbnail]', err.message);
		res.status(204).end();
	}
};

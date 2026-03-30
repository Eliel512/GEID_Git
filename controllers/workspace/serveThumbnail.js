/**
 * serveThumbnail — Miniature d'un fichier workspace via MinIO uniquement.
 */

'use strict';

const paths = require('path');
const storage = require('../../tools/storage');
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const { getThumbnail, isSupported } = require('../../tools/thumbnail');

exports.serveThumbnail = async (req, res) => {
	const userId = res.locals.userId;
	const filePath = decodeURIComponent(req.params[0] || '');

	if (!filePath) return res.status(400).json({ message: 'Chemin invalide.' });

	const parts = filePath.split('/');
	if (parts[0] !== userId) {
		// Vérifier si le fichier est partagé avec cet utilisateur
		const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
		const fileName = require('path').basename(filePath);
		const subPath = parts.slice(1, -1).join('/');
		const shared = await WorkspaceFile.findOne({ owner: parts[0], path: subPath, name: fileName, 'sharedWith.userId': userId });
		if (!shared) return res.status(403).json({ message: 'Accès non autorisé.' });
	}

	if (!isSupported(filePath)) return res.status(204).end();

	const quality = req.query.quality || 'medium';

	// ETag basee sur le chemin + qualite pour cache navigateur
	const crypto = require('crypto');
	const etag = '"' + crypto.createHash('md5').update(filePath + quality).digest('hex') + '"';

	// Repondre 304 si le navigateur a deja ce thumbnail
	if (req.headers['if-none-match'] === etag) {
		return res.status(304).end();
	}

	res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 jours
	res.setHeader('ETag', etag);
	res.setHeader('Content-Type', 'image/webp');

	try {
		const relPath = paths.join('workspace', filePath);

		const chunks = [];
		const stream = await storage.getFileStream(relPath);
		for await (const chunk of stream) chunks.push(chunk);
		const fileBuffer = Buffer.concat(chunks);

		if (!fileBuffer || fileBuffer.length === 0) return res.status(204).end();

		const thumb = await getThumbnail(fileBuffer, paths.basename(filePath), relPath, quality);
		if (thumb) {
			// Marquer comme consulte (fire-and-forget)
			const parts = filePath.split('/');
			const fileOwnerId = parts[0];
			const fileName = paths.basename(filePath);
			const subPath = parts.slice(1, -1).join('/');
			WorkspaceFile.findOneAndUpdate(
				{ owner: fileOwnerId, path: subPath, name: fileName },
				{ lastAccessedAt: new Date() }
			).catch(() => {});
			return res.end(thumb);
		}

		res.status(204).end();
	} catch (err) {
		console.error('[serveThumbnail]', err.message);
		res.status(204).end();
	}
};

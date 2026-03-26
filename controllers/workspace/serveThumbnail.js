/**
 * serveThumbnail — Sert une miniature (200x200 webp) pour un fichier workspace.
 *
 * GET /api/stuff/workspace/thumbnail/:userId/category/file.jpg
 *
 * - Vérifie que le fichier appartient à l'utilisateur
 * - Génère la miniature si pas en cache (via sharp)
 * - Sert depuis le cache si déjà générée
 * - Retourne 204 si le type n'est pas supporté (le frontend affiche l'icône par défaut)
 */

'use strict';

const paths = require('path');
const fs = require('fs');
const storage = require('../../tools/storage');
const { generateThumbnail, generateThumbnailFromBuffer, IMAGE_EXTS, getExt } = require('../../tools/thumbnail');
const { WORKSPACE_BASE, safePath } = require('./utils');

exports.serveThumbnail = async (req, res) => {
	const userId = res.locals.userId;
	const filePath = decodeURIComponent(req.params[0] || '');

	if (!filePath) return res.status(400).json({ message: 'Chemin invalide.' });

	// Vérifier que le fichier appartient à cet utilisateur
	const parts = filePath.split('/');
	if (parts[0] !== userId) return res.status(403).json({ message: 'Accès non autorisé.' });

	const ext = getExt(filePath);
	if (!IMAGE_EXTS.has(ext)) {
		// Type non supporté — le frontend affiche l'icône par défaut
		return res.status(204).end();
	}

	// Cache headers — miniatures rarement changent
	res.setHeader('Cache-Control', 'public, max-age=86400'); // 24h
	res.setHeader('Content-Type', 'image/webp');

	try {
		const relPath = paths.join('workspace', filePath);
		const absPath = safePath(WORKSPACE_BASE, filePath);

		// Essayer depuis le filesystem (plus rapide pour le thumbnail)
		if (absPath && fs.existsSync(absPath)) {
			const thumb = await generateThumbnail(absPath);
			if (thumb) return res.end(thumb.buffer);
		}

		// Essayer depuis MinIO
		if (storage.MINIO_ENABLED) {
			try {
				const chunks = [];
				const stream = await storage.getFileStream(relPath);
				for await (const chunk of stream) chunks.push(chunk);
				const fileBuffer = Buffer.concat(chunks);
				const thumb = await generateThumbnailFromBuffer(fileBuffer, filePath);
				if (thumb) return res.end(thumb.buffer);
			} catch { /* MinIO error — fallback */ }
		}

		// Pas de thumbnail possible
		return res.status(204).end();
	} catch (err) {
		console.error('[serveThumbnail]', err.message);
		return res.status(204).end();
	}
};

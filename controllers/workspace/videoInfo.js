/**
 * videoInfo — Retourne les métadonnées d'une vidéo workspace via le micro-service Python.
 *
 * GET /api/stuff/workspace/video-info/:userId/path/to/video.mp4
 */

'use strict';

const paths = require('path');
const fs = require('fs');
const http = require('http');
const storage = require('../../tools/storage');
const { WORKSPACE_BASE, safePath } = require('./utils');

const THUMB_SERVICE = process.env.THUMB_SERVICE_URL || 'http://geid-thumbgen:9090';

exports.getVideoInfo = async (req, res) => {
	const userId = res.locals.userId;
	const filePath = decodeURIComponent(req.params[0] || '');

	if (!filePath) return res.status(400).json({ message: 'Chemin invalide.' });
	const parts = filePath.split('/');
	if (parts[0] !== userId) return res.status(403).json({ message: 'Accès non autorisé.' });

	try {
		const relPath = paths.join('workspace', filePath);
		let fileBuffer;

		// Lire depuis MinIO ou filesystem
		if (storage.MINIO_ENABLED) {
			try {
				const chunks = [];
				const stream = await storage.getFileStream(relPath);
				for await (const chunk of stream) chunks.push(chunk);
				fileBuffer = Buffer.concat(chunks);
			} catch { /* fallback fs */ }
		}

		if (!fileBuffer) {
			const absPath = safePath(WORKSPACE_BASE, filePath);
			if (absPath && fs.existsSync(absPath)) {
				fileBuffer = fs.readFileSync(absPath);
			}
		}

		if (!fileBuffer) return res.status(404).json({ message: 'Fichier introuvable.' });

		// Appeler le micro-service Python /video-info
		const filename = paths.basename(filePath);
		const boundary = '----VIBoundary' + Date.now();
		const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`;
		const fieldPart = `\r\n--${boundary}\r\nContent-Disposition: form-data; name="filename"\r\n\r\n${filename}\r\n--${boundary}--\r\n`;
		const body = Buffer.concat([Buffer.from(header), fileBuffer, Buffer.from(fieldPart)]);

		const url = new URL(`${THUMB_SERVICE}/video-info`);
		const proxyReq = http.request({
			hostname: url.hostname,
			port: url.port,
			path: url.pathname,
			method: 'POST',
			headers: {
				'Content-Type': `multipart/form-data; boundary=${boundary}`,
				'Content-Length': body.length,
			},
			timeout: 30000,
		}, (proxyRes) => {
			if (proxyRes.statusCode !== 200) {
				return res.status(204).end();
			}
			const chunks = [];
			proxyRes.on('data', (c) => chunks.push(c));
			proxyRes.on('end', () => {
				try {
					const info = JSON.parse(Buffer.concat(chunks).toString());
					res.json(info);
				} catch {
					res.status(204).end();
				}
			});
		});

		proxyReq.on('error', () => res.status(204).end());
		proxyReq.on('timeout', () => { proxyReq.destroy(); res.status(204).end(); });
		proxyReq.write(body);
		proxyReq.end();
	} catch (err) {
		console.error('[videoInfo]', err.message);
		res.status(204).end();
	}
};

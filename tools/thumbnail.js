/**
 * thumbnail.js — Génération et cache de miniatures via MinIO.
 *
 * Stockage : bucket MinIO "thumbnails" (pas de fichiers locaux).
 *
 * Stratégie :
 *   1. Vérifier si la miniature existe dans MinIO (cache)
 *   2. Si non : générer via sharp (images) ou micro-service Python (PDF/Office)
 *   3. Stocker dans MinIO et retourner
 */

'use strict';

const crypto = require('crypto');
const storage = require('./storage');

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'tif', 'avif']);
const PDF_EXTS = new Set(['pdf']);
const OFFICE_EXTS = new Set(['docx', 'xlsx', 'pptx', 'doc', 'xls', 'ppt', 'odt', 'ods', 'odp', 'rtf']);
const TEXT_EXTS = new Set(['txt', 'md', 'csv', 'log', 'json', 'xml', 'html', 'css', 'js', 'ts', 'py', 'sh', 'yml', 'yaml', 'ini', 'cfg', 'conf', 'env']);
const VIDEO_EXTS = new Set(['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'mpg', 'mpeg', 'mxf', 'qt', 'asf']);
const ALL_SUPPORTED = new Set([...IMAGE_EXTS, ...PDF_EXTS, ...OFFICE_EXTS, ...TEXT_EXTS, ...VIDEO_EXTS]);

const THUMB_SIZE = 200;
const QUALITY_MAP = {
	low:    { size: 100, quality: 30 },
	medium: { size: 200, quality: 60 },
	high:   { size: 400, quality: 85 },
};
const THUMB_BUCKET = 'thumbnails';
const THUMB_SERVICE_URL = process.env.THUMB_SERVICE_URL || 'http://geid-thumbgen:9090';

function getExt(filename) {
	return (filename || '').split('.').pop()?.toLowerCase() || '';
}

const THUMB_VERSION = 'v2'; // Incrementer pour invalider le cache
function thumbKey(filePath, fileSize, quality) {
	const suffix = quality && quality !== 'medium' ? `:${quality}` : '';
	const hash = crypto.createHash('md5').update(`${THUMB_VERSION}:${filePath}:${fileSize || 0}${suffix}`).digest('hex');
	return `${hash}.webp`;
}

/**
 * Vérifie si un format est supporté pour la génération de miniatures.
 */
function isSupported(filename) {
	return ALL_SUPPORTED.has(getExt(filename));
}

/**
 * Récupère ou génère une miniature.
 *
 * @param {Buffer} fileBuffer — contenu du fichier source
 * @param {string} filename — nom du fichier (pour déterminer le type)
 * @param {string} cacheId — identifiant unique pour le cache (ex: chemin MinIO)
 * @param {'low'|'medium'|'high'} [quality='medium'] — qualité de la miniature
 * @returns {Promise<Buffer|null>} — buffer WebP ou null
 */
async function getThumbnail(fileBuffer, filename, cacheId, quality) {
	const ext = getExt(filename);
	if (!ALL_SUPPORTED.has(ext)) return null;

	const q = QUALITY_MAP[quality] ? quality : 'medium';
	const { size, quality: webpQuality } = QUALITY_MAP[q];
	const key = thumbKey(cacheId || filename, fileBuffer?.length, q);

	// 1. Vérifier le cache MinIO
	if (storage.MINIO_ENABLED) {
		try {
			const cached = await storage.getFileBuffer(`${THUMB_BUCKET}/${key}`);
			if (cached) return cached;
		} catch { /* pas en cache */ }
	}

	// 2. Générer la miniature
	let thumbBuffer = null;

	if (IMAGE_EXTS.has(ext)) {
		// Images : sharp directement
		thumbBuffer = await generateImageThumb(fileBuffer, size, webpQuality);
	} else if (PDF_EXTS.has(ext) || OFFICE_EXTS.has(ext) || TEXT_EXTS.has(ext) || VIDEO_EXTS.has(ext)) {
		// PDF/Office/Texte : appeler le micro-service Python
		thumbBuffer = await callThumbService(fileBuffer, filename, q);
	}

	if (!thumbBuffer) return null;

	// 3. Stocker dans MinIO (double clé : avec taille + sans taille pour accès cache-only)
	if (storage.MINIO_ENABLED) {
		const poKey = pathOnlyKey(cacheId || filename, q);
		try {
			await Promise.all([
				storage.uploadFile(`${THUMB_BUCKET}/${key}`, thumbBuffer, 'image/webp'),
				key !== poKey ? storage.uploadFile(`${THUMB_BUCKET}/${poKey}`, thumbBuffer, 'image/webp') : Promise.resolve(),
			]);
		} catch (err) {
			console.error('[thumbnail:cache]', err.message);
		}
	}

	return thumbBuffer;
}

/**
 * Génère une miniature d'image avec sharp.
 */
async function generateImageThumb(buffer, size = THUMB_SIZE, webpQuality = 60) {
	try {
		const sharp = require('sharp');
		return await sharp(buffer)
			.resize(size, size, { fit: 'inside', withoutEnlargement: true })
			.webp({ quality: webpQuality })
			.toBuffer();
	} catch (err) {
		console.error('[thumbnail:sharp]', err.message);
		return null;
	}
}

/**
 * Appelle le micro-service Python pour PDF/Office → miniature.
 */
async function callThumbService(fileBuffer, filename, quality) {
	try {
		const FormData = require('form-data') || globalThis.FormData;
		// Node 18 n'a pas fetch natif avec FormData multipart — utilisons http
		const http = require('http');
		const url = new URL(`${THUMB_SERVICE_URL}/generate`);

		return new Promise((resolve) => {
			const boundary = '----ThumbBoundary' + Date.now();
			const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`;
			const qualityField = `\r\n--${boundary}\r\nContent-Disposition: form-data; name="quality"\r\n\r\n${quality || 'medium'}`;
			const fieldPart = `\r\n--${boundary}\r\nContent-Disposition: form-data; name="filename"\r\n\r\n${filename}\r\n--${boundary}--\r\n`;
			const body = Buffer.concat([Buffer.from(header), fileBuffer, Buffer.from(qualityField), Buffer.from(fieldPart)]);

			const req = http.request({
				hostname: url.hostname,
				port: url.port,
				path: url.pathname,
				method: 'POST',
				headers: {
					'Content-Type': `multipart/form-data; boundary=${boundary}`,
					'Content-Length': body.length,
				},
				timeout: 30000,
			}, (res) => {
				if (res.statusCode !== 200) {
					resolve(null);
					return;
				}
				const chunks = [];
				res.on('data', (c) => chunks.push(c));
				res.on('end', () => resolve(Buffer.concat(chunks)));
			});

			req.on('error', () => resolve(null));
			req.on('timeout', () => { req.destroy(); resolve(null); });
			req.write(body);
			req.end();
		});
	} catch (err) {
		console.error('[thumbnail:service]', err.message);
		return null;
	}
}

/** Clé de cache basée uniquement sur le chemin + qualité (sans taille fichier) */
function pathOnlyKey(cacheId, quality) {
	const suffix = quality && quality !== 'medium' ? `:${quality}` : '';
	return crypto.createHash('md5').update(`${THUMB_VERSION}:${cacheId}${suffix}`).digest('hex') + '.webp';
}

/**
 * Vérifie uniquement le cache MinIO sans lire le fichier source.
 * Utile pour les fichiers en corbeille dont le source est supprimé.
 */
async function getCachedThumbnail(cacheId, quality) {
	if (!storage.MINIO_ENABLED) return null;
	const q = QUALITY_MAP[quality] ? quality : 'medium';
	const key = pathOnlyKey(cacheId, q);
	try {
		return await storage.getFileBuffer(`${THUMB_BUCKET}/${key}`);
	} catch { return null; }
}

module.exports = { getThumbnail, getCachedThumbnail, isSupported, getExt, IMAGE_EXTS, PDF_EXTS, OFFICE_EXTS, ALL_SUPPORTED };

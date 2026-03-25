/**
 * thumbnail.js — Génération de miniatures à la demande pour les fichiers workspace et archives.
 *
 * Stratégie :
 *   1. Images (jpg, png, webp, gif, bmp, tiff) → redimensionnement via sharp (200x200)
 *   2. PDF → première page convertie en image via sharp (si le fichier est un buffer PDF)
 *   3. Autres → retourne null (le frontend affiche l'icône par défaut)
 *
 * Cache :
 *   - Miniatures stockées dans un dossier `thumbnails/` local
 *   - Clé de cache : hash MD5 du chemin + taille du fichier
 *   - Si le cache existe, il est servi directement
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const THUMB_DIR = path.join(__dirname, '..', 'thumbnails');
const THUMB_SIZE = 200; // px
const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'tif', 'avif']);

// Crée le dossier thumbnails au démarrage
try { fs.mkdirSync(THUMB_DIR, { recursive: true }); } catch { /* ignore */ }

/**
 * Génère une clé de cache unique pour un fichier.
 */
function cacheKey(filePath, stat) {
	const hash = crypto.createHash('md5')
		.update(`${filePath}:${stat?.size ?? 0}:${stat?.mtimeMs ?? 0}`)
		.digest('hex');
	return hash + '.webp';
}

/**
 * Retourne l'extension en minuscule d'un nom de fichier.
 */
function getExt(filename) {
	return (filename || '').split('.').pop()?.toLowerCase() || '';
}

/**
 * Génère ou retourne la miniature d'un fichier.
 *
 * @param {string} absolutePath — chemin absolu du fichier source
 * @returns {Promise<{ buffer: Buffer, contentType: string } | null>}
 *          — le buffer de la miniature ou null si pas supporté
 */
async function generateThumbnail(absolutePath) {
	let sharp;
	try { sharp = require('sharp'); } catch {
		return null; // sharp non installé — pas de thumbnail
	}

	const ext = getExt(absolutePath);
	if (!IMAGE_EXTS.has(ext)) return null; // type non supporté

	// Vérifier que le fichier existe
	let stat;
	try { stat = fs.statSync(absolutePath); } catch { return null; }

	// Vérifier le cache
	const thumbName = cacheKey(absolutePath, stat);
	const thumbPath = path.join(THUMB_DIR, thumbName);

	if (fs.existsSync(thumbPath)) {
		return { buffer: fs.readFileSync(thumbPath), contentType: 'image/webp' };
	}

	// Générer la miniature
	try {
		const buffer = await sharp(absolutePath)
			.resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover', position: 'centre' })
			.webp({ quality: 75 })
			.toBuffer();

		// Sauvegarder en cache
		fs.writeFileSync(thumbPath, buffer);
		return { buffer, contentType: 'image/webp' };
	} catch (err) {
		console.error('[thumbnail]', err.message);
		return null;
	}
}

/**
 * Génère une miniature depuis un buffer (pour les fichiers stockés dans MinIO).
 */
async function generateThumbnailFromBuffer(fileBuffer, filename) {
	let sharp;
	try { sharp = require('sharp'); } catch { return null; }

	const ext = getExt(filename);
	if (!IMAGE_EXTS.has(ext)) return null;

	try {
		const buffer = await sharp(fileBuffer)
			.resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover', position: 'centre' })
			.webp({ quality: 75 })
			.toBuffer();
		return { buffer, contentType: 'image/webp' };
	} catch (err) {
		console.error('[thumbnail:buffer]', err.message);
		return null;
	}
}

module.exports = { generateThumbnail, generateThumbnailFromBuffer, getExt, IMAGE_EXTS };

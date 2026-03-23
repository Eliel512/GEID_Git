'use strict';

/**
 * tools/storage.js — Abstraction MinIO / filesystem pour le stockage de fichiers
 *
 * DUAL-WRITE : les controllers ecrivent d'abord sur le filesystem local (existant),
 * puis appellent ce module pour repliquer vers MinIO.
 *
 * Si MINIO_ENDPOINT n'est pas defini, toutes les operations tombent en fallback
 * sur le filesystem local (backward compat pour le dev local).
 *
 * Mapping des prefixes de chemin vers les buckets MinIO :
 *   ARCHIVES/   -> bucket "archives"
 *   workspace/  -> bucket "workspace"
 *   profils/    -> bucket "profils"
 *   salon/      -> bucket "salon"
 *   ressources/ -> bucket "ressources"
 */

const fs   = require('fs');
const path = require('path');
const { Readable } = require('stream');

// ── Configuration MinIO ─────────────────────────────────────────────────────

const MINIO_ENABLED = !!process.env.MINIO_ENDPOINT;

let minioClient = null;

if (MINIO_ENABLED) {
    const Minio = require('minio');
    minioClient = new Minio.Client({
        endPoint:  process.env.MINIO_ENDPOINT  || 'geid-minio',
        port:      parseInt(process.env.MINIO_PORT || '9000', 10),
        useSSL:    process.env.MINIO_USE_SSL === 'true',
        accessKey: process.env.MINIO_ACCESS_KEY || '',
        secretKey: process.env.MINIO_SECRET_KEY || '',
    });
    console.log('[storage] MinIO enabled — endpoint:', process.env.MINIO_ENDPOINT);
} else {
    console.log('[storage] MinIO disabled (MINIO_ENDPOINT not set) — filesystem fallback');
}

// ── Mapping chemin -> bucket + key ──────────────────────────────────────────

const BUCKET_MAP = [
    { prefix: 'ARCHIVES/', bucket: 'archives' },
    { prefix: 'workspace/', bucket: 'workspace' },
    { prefix: 'profils/', bucket: 'profils' },
    { prefix: 'salon/', bucket: 'salon' },
    { prefix: 'ressources/', bucket: 'ressources' },
];

/**
 * Determine le bucket et la cle a partir d'un chemin relatif.
 * @param {string} relativePath — ex: "ARCHIVES/direct/abc/file.pdf"
 * @returns {{ bucket: string, key: string } | null}
 */
function resolveBucketKey(relativePath) {
    // Normalise les separateurs Windows
    const normalized = relativePath.replace(/\\/g, '/');
    for (const mapping of BUCKET_MAP) {
        if (normalized.startsWith(mapping.prefix)) {
            return {
                bucket: mapping.bucket,
                key: normalized.slice(mapping.prefix.length),
            };
        }
    }
    // Aucun mapping trouve
    console.warn('[storage] No bucket mapping for path:', relativePath);
    return null;
}

/**
 * S'assure que le bucket existe, le cree sinon.
 */
async function ensureBucket(bucket) {
    try {
        const exists = await minioClient.bucketExists(bucket);
        if (!exists) {
            await minioClient.makeBucket(bucket, '');
            console.log('[storage] Bucket created:', bucket);
        }
    } catch (err) {
        console.error('[storage] ensureBucket error:', bucket, err.message);
    }
}

// ── Fonctions exportees ─────────────────────────────────────────────────────

/**
 * Upload un buffer vers MinIO.
 * @param {string} relativePath — chemin relatif (ex: "ARCHIVES/direct/xyz/file.pdf")
 * @param {Buffer} buffer
 */
async function uploadFile(relativePath, buffer) {
    if (!MINIO_ENABLED) return;
    const resolved = resolveBucketKey(relativePath);
    if (!resolved) return;
    try {
        await ensureBucket(resolved.bucket);
        await minioClient.putObject(resolved.bucket, resolved.key, buffer);
    } catch (err) {
        console.error('[storage] uploadFile error:', relativePath, err.message);
    }
}

/**
 * Upload un fichier depuis le disque local vers MinIO (streaming).
 * @param {string} relativePath — chemin relatif dans le systeme de stockage
 * @param {string} localFilePath — chemin absolu du fichier sur le disque
 */
async function uploadFileFromDisk(relativePath, localFilePath) {
    if (!MINIO_ENABLED) return;
    const resolved = resolveBucketKey(relativePath);
    if (!resolved) return;
    try {
        await ensureBucket(resolved.bucket);
        await minioClient.fPutObject(resolved.bucket, resolved.key, localFilePath);
    } catch (err) {
        console.error('[storage] uploadFileFromDisk error:', relativePath, err.message);
    }
}

/**
 * Supprime un fichier de MinIO.
 * @param {string} relativePath
 */
async function deleteFile(relativePath) {
    if (!MINIO_ENABLED) return;
    const resolved = resolveBucketKey(relativePath);
    if (!resolved) return;
    try {
        await minioClient.removeObject(resolved.bucket, resolved.key);
    } catch (err) {
        console.error('[storage] deleteFile error:', relativePath, err.message);
    }
}

/**
 * Retourne l'URL interne MinIO d'un fichier.
 * @param {string} relativePath
 * @returns {string}
 */
function getFileUrl(relativePath) {
    const resolved = resolveBucketKey(relativePath);
    if (!resolved) return relativePath;
    if (MINIO_ENABLED) {
        const endpoint = process.env.MINIO_ENDPOINT || 'geid-minio';
        const port     = process.env.MINIO_PORT || '9000';
        return `http://${endpoint}:${port}/${resolved.bucket}/${resolved.key}`;
    }
    return relativePath;
}

/**
 * Retourne un readable stream du fichier.
 * @param {string} relativePath
 * @returns {Promise<import('stream').Readable>}
 */
async function getFileStream(relativePath) {
    if (!MINIO_ENABLED) {
        // Fallback filesystem
        const mainDir = path.dirname(require.main.filename);
        return fs.createReadStream(path.join(mainDir, relativePath));
    }
    const resolved = resolveBucketKey(relativePath);
    if (!resolved) throw new Error('No bucket mapping for: ' + relativePath);
    return minioClient.getObject(resolved.bucket, resolved.key);
}

/**
 * Verifie si un fichier existe dans MinIO.
 * @param {string} relativePath
 * @returns {Promise<boolean>}
 */
async function fileExists(relativePath) {
    if (!MINIO_ENABLED) {
        const mainDir = path.dirname(require.main.filename);
        return fs.existsSync(path.join(mainDir, relativePath));
    }
    const resolved = resolveBucketKey(relativePath);
    if (!resolved) return false;
    try {
        await minioClient.statObject(resolved.bucket, resolved.key);
        return true;
    } catch {
        return false;
    }
}

/**
 * Copie un fichier d'un chemin a un autre (possiblement entre buckets).
 * @param {string} srcRelativePath
 * @param {string} destRelativePath
 */
async function copyFile(srcRelativePath, destRelativePath) {
    if (!MINIO_ENABLED) return;
    const src  = resolveBucketKey(srcRelativePath);
    const dest = resolveBucketKey(destRelativePath);
    if (!src || !dest) return;
    try {
        await ensureBucket(dest.bucket);
        const conditions = new (require('minio')).CopyConditions();
        await minioClient.copyObject(
            dest.bucket,
            dest.key,
            `/${src.bucket}/${src.key}`,
            conditions
        );
    } catch (err) {
        console.error('[storage] copyFile error:', srcRelativePath, '->', destRelativePath, err.message);
    }
}

/**
 * No-op — MinIO n'a pas besoin de repertoires.
 * Conserve pour la retro-compatibilite.
 * @param {string} _relativePath
 */
async function ensureDir(_relativePath) {
    // MinIO gere les prefixes automatiquement, rien a faire.
}

/**
 * Supprime tous les objets avec un prefixe donne.
 * @param {string} relativePath — prefixe du repertoire
 */
async function deleteDir(relativePath) {
    if (!MINIO_ENABLED) return;
    const resolved = resolveBucketKey(relativePath);
    if (!resolved) return;
    try {
        // Ajoute un trailing slash si absent pour lister le "dossier"
        const prefix = resolved.key.endsWith('/') ? resolved.key : resolved.key + '/';
        const objectsList = [];
        const stream = minioClient.listObjects(resolved.bucket, prefix, true);
        await new Promise((resolve, reject) => {
            stream.on('data', obj => objectsList.push(obj.name));
            stream.on('error', reject);
            stream.on('end', resolve);
        });
        if (objectsList.length > 0) {
            await minioClient.removeObjects(resolved.bucket, objectsList);
        }
    } catch (err) {
        console.error('[storage] deleteDir error:', relativePath, err.message);
    }
}

/**
 * Renomme un fichier (copy + delete, MinIO n'a pas de rename natif).
 * @param {string} oldPath
 * @param {string} newPath
 */
async function renameFile(oldPath, newPath) {
    if (!MINIO_ENABLED) return;
    await copyFile(oldPath, newPath);
    await deleteFile(oldPath);
}

/**
 * Liste les objets avec un prefixe donne.
 * @param {string} relativePath
 * @returns {Promise<string[]>} — liste des cles relatives
 */
async function listFiles(relativePath) {
    if (!MINIO_ENABLED) {
        // Fallback filesystem
        const mainDir = path.dirname(require.main.filename);
        const dirPath = path.join(mainDir, relativePath);
        try {
            return fs.readdirSync(dirPath);
        } catch {
            return [];
        }
    }
    const resolved = resolveBucketKey(relativePath);
    if (!resolved) return [];
    try {
        const prefix = resolved.key.endsWith('/') ? resolved.key : resolved.key + '/';
        const objects = [];
        const stream = minioClient.listObjects(resolved.bucket, prefix, false);
        await new Promise((resolve, reject) => {
            stream.on('data', obj => objects.push(obj.name || obj.prefix));
            stream.on('error', reject);
            stream.on('end', resolve);
        });
        return objects;
    } catch (err) {
        console.error('[storage] listFiles error:', relativePath, err.message);
        return [];
    }
}

// ── Export ───────────────────────────────────────────────────────────────────

module.exports = {
    uploadFile,
    uploadFileFromDisk,
    deleteFile,
    getFileUrl,
    getFileStream,
    fileExists,
    copyFile,
    ensureDir,
    deleteDir,
    renameFile,
    listFiles,
    resolveBucketKey,
    MINIO_ENABLED,
};

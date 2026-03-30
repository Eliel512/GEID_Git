/**
 * docPages — API de rendu page par page pour le lecteur de documents.
 *
 * GET /doc-info/:filePath  → { pageCount, pages: [{ page, text }] }
 * GET /doc-page/:filePath?page=N  → image/webp de la page N
 *
 * Cache MinIO : workspace-doc-pages/{hash}/info.json + page-N.webp
 */

'use strict';

const crypto = require('crypto');
const http = require('http');
const paths = require('path');
const storage = require('../../tools/storage');
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');

const THUMB_SERVICE = process.env.THUMB_SERVICE_URL || 'http://geid-thumbgen:9090';
const SUPPORTED_EXTS = new Set(['pdf', 'docx', 'xlsx', 'pptx', 'doc', 'xls', 'ppt', 'odt', 'ods', 'odp']);
const CACHE_PREFIX = 'workspace-doc-pages';

function cacheKey(filePath) {
  return crypto.createHash('md5').update(filePath).digest('hex');
}

/** Envoie un fichier au micro-service Python et retourne la reponse JSON ou Buffer */
function callService(endpoint, fileBuffer, filename, extraFields = {}) {
  return new Promise((resolve, reject) => {
    const boundary = '----DocBoundary' + Date.now();
    const parts = [];

    // File part
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`
    ));
    parts.push(fileBuffer);

    // Filename field
    parts.push(Buffer.from(
      `\r\n--${boundary}\r\nContent-Disposition: form-data; name="filename"\r\n\r\n${filename}`
    ));

    // Extra fields
    for (const [key, val] of Object.entries(extraFields)) {
      parts.push(Buffer.from(
        `\r\n--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}`
      ));
    }

    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
    const body = Buffer.concat(parts);

    const url = new URL(`${THUMB_SERVICE}${endpoint}`);
    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
      timeout: 180000, // 3 min pour les gros documents
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (res.statusCode !== 200) {
          try { reject(new Error(JSON.parse(buf.toString()).error || 'Service error')); }
          catch { reject(new Error(`Service HTTP ${res.statusCode}`)); }
          return;
        }
        resolve({ buffer: buf, contentType: res.headers['content-type'] || '' });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(body);
    req.end();
  });
}

/**
 * GET /api/stuff/workspace/doc-info/*
 * Retourne { pageCount, pages: [{ page, text }] }
 */
exports.getDocInfo = async (req, res) => {
  const userId = res.locals.userId;
  const filePath = decodeURIComponent(req.params[0] || '');
  if (!filePath) return res.status(400).json({ message: 'Chemin invalide.' });

  const ext = paths.extname(filePath).slice(1).toLowerCase();
  if (!SUPPORTED_EXTS.has(ext)) return res.status(415).json({ message: 'Format non supporte.' });

  const hash = cacheKey(filePath);
  const infoCachePath = `${CACHE_PREFIX}/${hash}/info.json`;

  try {
    // 1. Verifier le cache
    try {
      const cached = await storage.getFileBuffer(infoCachePath);
      if (cached) return res.status(200).json(JSON.parse(cached.toString()));
    } catch { /* pas en cache */ }

    // 2. Charger le fichier source
    const relPath = paths.join('workspace', filePath);
    const chunks = [];
    const stream = await storage.getFileStream(relPath);
    for await (const chunk of stream) chunks.push(chunk);
    const fileBuffer = Buffer.concat(chunks);

    // 3. Appeler le micro-service
    const { buffer: responseBuffer } = await callService('/doc-info', fileBuffer, paths.basename(filePath));
    const info = JSON.parse(responseBuffer.toString());

    // 4. Mettre en cache
    await storage.uploadFile(infoCachePath, responseBuffer, 'application/json').catch(() => {});

    res.status(200).json(info);
  } catch (err) {
    console.error('[docPages.getDocInfo]', err.message);
    res.status(500).json({ message: 'Impossible de charger les informations du document.' });
  }
};

/**
 * GET /api/stuff/workspace/doc-page/*?page=N
 * Retourne image/webp de la page N
 */
exports.getDocPage = async (req, res) => {
  const userId = res.locals.userId;
  const filePath = decodeURIComponent(req.params[0] || '');
  const page = parseInt(req.query.page) || 1;
  if (!filePath) return res.status(400).json({ message: 'Chemin invalide.' });

  const ext = paths.extname(filePath).slice(1).toLowerCase();
  if (!SUPPORTED_EXTS.has(ext)) return res.status(415).json({ message: 'Format non supporte.' });

  const hash = cacheKey(filePath);
  const pageCachePath = `${CACHE_PREFIX}/${hash}/page-${page}.webp`;

  // ETag
  const etag = `"${hash}-p${page}"`;
  if (req.headers['if-none-match'] === etag) return res.status(304).end();

  try {
    // 1. Verifier le cache
    try {
      const cached = await storage.getFileBuffer(pageCachePath);
      if (cached) {
        res.setHeader('Content-Type', 'image/webp');
        res.setHeader('Cache-Control', 'public, max-age=604800');
        res.setHeader('ETag', etag);
        return res.end(cached);
      }
    } catch { /* pas en cache */ }

    // 2. Charger le fichier source
    const relPath = paths.join('workspace', filePath);
    const chunks = [];
    const stream = await storage.getFileStream(relPath);
    for await (const chunk of stream) chunks.push(chunk);
    const fileBuffer = Buffer.concat(chunks);

    // 3. Appeler le micro-service
    const { buffer: pageImage } = await callService('/doc-page', fileBuffer, paths.basename(filePath), {
      page: String(page),
      dpi: '200',
    });

    // 4. Mettre en cache
    await storage.uploadFile(pageCachePath, pageImage, 'image/webp').catch(() => {});

    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.setHeader('ETag', etag);
    res.end(pageImage);
  } catch (err) {
    console.error('[docPages.getDocPage]', err.message);
    res.status(500).json({ message: 'Impossible de charger la page.' });
  }
};

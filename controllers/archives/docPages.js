/**
 * docPages archives — API de rendu page par page pour les archives.
 *
 * GET /api/stuff/archives/doc-info/:id  → { pageCount, pages: [{ page, text, spans }] }
 * GET /api/stuff/archives/doc-page/:id?page=N  → image/webp de la page N
 */

'use strict';

const crypto = require('crypto');
const http = require('http');
const paths = require('path');
const storage = require('../../tools/storage');
const Archive = require('../../models/archives/archive.model');

const THUMB_SERVICE = process.env.THUMB_SERVICE_URL || 'http://geid-thumbgen:9090';
const SUPPORTED_EXTS = new Set(['pdf', 'docx', 'xlsx', 'pptx', 'doc', 'xls', 'ppt', 'odt', 'ods', 'odp']);
const CACHE_PREFIX = 'workspace-doc-pages';

function cacheKey(filePath) {
  return crypto.createHash('md5').update(filePath).digest('hex');
}

function callService(endpoint, fileBuffer, filename, extraFields = {}) {
  return new Promise((resolve, reject) => {
    const boundary = '----DocBoundary' + Date.now();
    const parts = [];
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`));
    parts.push(fileBuffer);
    parts.push(Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="filename"\r\n\r\n${filename}`));
    for (const [key, val] of Object.entries(extraFields)) {
      parts.push(Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${val}`));
    }
    parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));
    const body = Buffer.concat(parts);
    const url = new URL(`${THUMB_SERVICE}${endpoint}`);
    const req = http.request({
      hostname: url.hostname, port: url.port, path: url.pathname, method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': body.length },
      timeout: 180000,
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

async function getArchiveFile(id, userId) {
  const archive = await Archive.findById(id).lean();
  if (!archive) return null;
  const fileUrl = archive.fileUrl;
  if (!fileUrl) return null;
  const chunks = [];
  const stream = await storage.getFileStream(fileUrl);
  for await (const chunk of stream) chunks.push(chunk);
  return { buffer: Buffer.concat(chunks), fileUrl, fileName: paths.basename(fileUrl) };
}

exports.getDocInfo = async (req, res) => {
  const id = req.params.id;
  try {
    const file = await getArchiveFile(id, res.locals.userId);
    if (!file) return res.status(404).json({ message: 'Archive introuvable.' });

    const ext = paths.extname(file.fileName).slice(1).toLowerCase();
    if (!SUPPORTED_EXTS.has(ext)) return res.status(415).json({ message: 'Format non supporte.' });

    const hash = cacheKey(file.fileUrl);
    const infoCachePath = `${CACHE_PREFIX}/${hash}/info.json`;

    try {
      const cached = await storage.getFileBuffer(infoCachePath);
      if (cached) return res.status(200).json(JSON.parse(cached.toString()));
    } catch { /* pas en cache */ }

    const { buffer: responseBuffer } = await callService('/doc-info', file.buffer, file.fileName);
    const info = JSON.parse(responseBuffer.toString());
    await storage.uploadFile(infoCachePath, responseBuffer, 'application/json').catch(() => {});
    res.status(200).json(info);
  } catch (err) {
    console.error('[archives.docPages.getDocInfo]', err.message);
    res.status(500).json({ message: 'Impossible de charger les informations du document.' });
  }
};

exports.getDocPage = async (req, res) => {
  const id = req.params.id;
  const page = parseInt(req.query.page) || 1;
  try {
    const file = await getArchiveFile(id, res.locals.userId);
    if (!file) return res.status(404).json({ message: 'Archive introuvable.' });

    const ext = paths.extname(file.fileName).slice(1).toLowerCase();
    if (!SUPPORTED_EXTS.has(ext)) return res.status(415).json({ message: 'Format non supporte.' });

    const hash = cacheKey(file.fileUrl);
    const pageCachePath = `${CACHE_PREFIX}/${hash}/page-${page}.webp`;
    const etag = `"${hash}-p${page}"`;
    if (req.headers['if-none-match'] === etag) return res.status(304).end();

    try {
      const cached = await storage.getFileBuffer(pageCachePath);
      if (cached) {
        res.setHeader('Content-Type', 'image/webp');
        res.setHeader('Cache-Control', 'public, max-age=604800');
        res.setHeader('ETag', etag);
        return res.end(cached);
      }
    } catch { /* pas en cache */ }

    const { buffer: pageImage } = await callService('/doc-page', file.buffer, file.fileName, { page: String(page), dpi: '200' });
    await storage.uploadFile(pageCachePath, pageImage, 'image/webp').catch(() => {});
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.setHeader('ETag', etag);
    res.end(pageImage);
  } catch (err) {
    console.error('[archives.docPages.getDocPage]', err.message);
    res.status(500).json({ message: 'Impossible de charger la page.' });
  }
};

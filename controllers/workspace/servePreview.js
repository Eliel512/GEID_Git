/**
 * servePreview — Sert un apercu PDF d'un fichier workspace.
 * - PDF/Images : redirige vers serveFile
 * - Office : convertit en PDF via micro-service, cache dans MinIO
 */

const paths = require('path');
const http = require('http');
const jwt = require('jsonwebtoken');
const storage = require('../../tools/storage');
const mime = require('mime-types');
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');

const THUMB_SERVICE = process.env.THUMB_SERVICE_URL || 'http://geid-thumbgen:9090';
const OFFICE_EXTS = new Set(['docx', 'xlsx', 'pptx', 'doc', 'xls', 'ppt', 'odt', 'ods', 'odp', 'rtf']);
const PDF_EXTS = new Set(['pdf']);
const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']);

exports.servePreview = async (req, res) => {
  let userId = res.locals.userId;
  const filePath = decodeURIComponent(req.params[0] || '');

  // Token temporaire
  if (!userId && req.query.token) {
    try {
      const decoded = jwt.verify(req.query.token, process.env.JWT_KEY || 'token');
      if (decoded.type === 'stream') userId = decoded.userId;
      else return res.status(403).json({ message: 'Token invalide.' });
    } catch { return res.status(403).json({ message: 'Token expire.' }); }
  }
  if (!userId) return res.status(401).json({ message: 'Non authentifie.' });
  if (!filePath) return res.status(400).json({ message: 'Chemin invalide.' });

  const parts = filePath.split('/');
  const fileOwnerId = parts[0];

  // Verifier acces
  if (fileOwnerId !== userId) {
    const fileName = paths.basename(filePath);
    const subPath = parts.slice(1, -1).join('/');
    const shared = await WorkspaceFile.findOne({
      owner: fileOwnerId, path: subPath, name: fileName, 'sharedWith.userId': userId,
    });
    if (!shared) return res.status(403).json({ message: 'Acces non autorise.' });
  }

  const relPath = paths.join('workspace', filePath);
  const ext = paths.extname(filePath).slice(1).toLowerCase();

  // PDF → servir directement
  if (PDF_EXTS.has(ext)) {
    try {
      const stream = await storage.getFileStream(relPath);
      res.setHeader('Content-Type', 'application/pdf');
      return stream.pipe(res);
    } catch { return res.status(404).json({ message: 'Fichier introuvable.' }); }
  }

  // Image → servir directement
  if (IMAGE_EXTS.has(ext)) {
    try {
      const mimeType = mime.lookup(filePath) || 'image/jpeg';
      const stream = await storage.getFileStream(relPath);
      res.setHeader('Content-Type', mimeType);
      return stream.pipe(res);
    } catch { return res.status(404).json({ message: 'Fichier introuvable.' }); }
  }

  // Office → convertir en PDF (avec cache)
  if (OFFICE_EXTS.has(ext)) {
    const cachePath = `workspace-previews/${filePath}.pdf`;

    // Verifier le cache
    try {
      const exists = await storage.fileExists(cachePath);
      if (exists) {
        const stream = await storage.getFileStream(cachePath);
        res.setHeader('Content-Type', 'application/pdf');
        return stream.pipe(res);
      }
    } catch { /* pas en cache */ }

    // Convertir via micro-service
    try {
      const fileStream = await storage.getFileStream(relPath);
      const chunks = [];
      for await (const chunk of fileStream) chunks.push(chunk);
      const fileBuffer = Buffer.concat(chunks);
      const fileName = paths.basename(filePath);

      const pdfBuffer = await convertToPdf(fileBuffer, fileName);
      if (!pdfBuffer) return res.status(500).json({ message: 'Conversion echouee.' });

      // Mettre en cache
      storage.uploadFile(cachePath, pdfBuffer).catch(() => {});

      res.setHeader('Content-Type', 'application/pdf');
      res.end(pdfBuffer);
    } catch (err) {
      console.error('[servePreview]', err.message);
      res.status(500).json({ message: 'Impossible de generer l\'apercu.' });
    }
    return;
  }

  // Type non supporte
  res.status(400).json({ message: 'Apercu non disponible pour ce type de fichier.' });
};

/** Envoie un fichier au micro-service Python pour conversion PDF */
function convertToPdf(buffer, filename) {
  return new Promise((resolve) => {
    try {
      const boundary = '----ConvertBoundary' + Date.now();
      const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`;
      const fieldPart = `\r\n--${boundary}\r\nContent-Disposition: form-data; name="filename"\r\n\r\n${filename}\r\n--${boundary}--\r\n`;
      const body = Buffer.concat([Buffer.from(header), buffer, Buffer.from(fieldPart)]);

      const url = new URL(`${THUMB_SERVICE}/convert-to-pdf`);
      const proxyReq = http.request({
        hostname: url.hostname, port: url.port, path: url.pathname, method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': body.length },
        timeout: 120000,
      }, (proxyRes) => {
        const chunks = [];
        proxyRes.on('data', (c) => chunks.push(c));
        proxyRes.on('end', () => {
          if (proxyRes.statusCode === 200) resolve(Buffer.concat(chunks));
          else resolve(null);
        });
      });
      proxyReq.on('error', () => resolve(null));
      proxyReq.on('timeout', () => { proxyReq.destroy(); resolve(null); });
      proxyReq.write(body);
      proxyReq.end();
    } catch { resolve(null); }
  });
}

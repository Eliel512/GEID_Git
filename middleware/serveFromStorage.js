/**
 * Middleware Express pour servir des fichiers depuis MinIO (ou filesystem fallback).
 * Remplace express.static() pour les dossiers migrés vers MinIO.
 *
 * Usage :
 *   app.use("/salon", serveFromStorage("salon"));
 *   app.use("/profils", serveFromStorage("profils"));
 */

const path = require('path');
const mime = require('mime-types');
const storage = require('../tools/storage');
const fs = require('fs');

module.exports = function serveFromStorage(prefix) {
  return async (req, res, next) => {
    const relativePath = prefix + decodeURIComponent(req.path);

    try {
      const exists = await storage.fileExists(relativePath);
      if (!exists) return next();

      const ext = path.extname(relativePath);
      const contentType = mime.lookup(ext) || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');

      const size = await storage.getFileSize(relativePath);
      if (size > 0) res.setHeader('Content-Length', size);

      const stream = await storage.getFileStream(relativePath);
      stream.pipe(res);
      stream.on('error', () => {
        if (!res.headersSent) res.status(500).end();
      });
    } catch {
      next();
    }
  };
};

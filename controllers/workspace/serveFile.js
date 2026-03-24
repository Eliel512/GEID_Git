const paths = require('path');
const storage = require('../../tools/storage');
const fs = require('fs');
const mime = require('mime-types');
const { WORKSPACE_BASE, safePath } = require('./utils');

exports.serveFile = async (req, res) => {
  const userId = res.locals.userId;
  const filePath = decodeURIComponent(req.params[0] || req.params.filePath || '');

  if (!filePath) {
    return res.status(400).json({ message: 'Chemin invalide.' });
  }

  // Verify the file belongs to this user
  const parts = filePath.split('/');
  if (parts[0] !== userId) {
    return res.status(403).json({ message: 'Accès non autorisé.' });
  }

  const relPath = paths.join('workspace', filePath);
  const absPath = safePath(WORKSPACE_BASE, filePath);
  if (!absPath) {
    return res.status(400).json({ message: 'Chemin non autorisé.' });
  }

  try {
    // Try MinIO first
    if (storage.MINIO_ENABLED) {
      try {
        const stream = await storage.getFileStream(relPath);
        const mimeType = mime.lookup(filePath) || 'application/octet-stream';
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${paths.basename(filePath)}"`);
        stream.pipe(res);
        return;
      } catch {
        // Fallback to filesystem
      }
    }

    // Filesystem fallback
    if (fs.existsSync(absPath)) {
      const mimeType = mime.lookup(filePath) || 'application/octet-stream';
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${paths.basename(filePath)}"`);
      fs.createReadStream(absPath).pipe(res);
    } else {
      res.status(404).json({ message: 'Fichier introuvable.' });
    }
  } catch {
    res.status(500).json({ message: 'Erreur lors de la lecture du fichier.' });
  }
};

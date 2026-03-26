const paths = require('path');
const storage = require('../../tools/storage');
const fs = require('fs');
const mime = require('mime-types');
const { WORKSPACE_BASE } = require('./utils');

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
  const mimeType = mime.lookup(filePath) || 'application/octet-stream';

  try {
    // Try MinIO first
    try {
      const stream = await storage.getFileStream(relPath);
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${paths.basename(filePath)}"`);
      stream.pipe(res);
      return;
    } catch {
      // Fallback to filesystem
    }

    // Filesystem fallback
    const absPath = paths.resolve(WORKSPACE_BASE, filePath);
    if (!absPath.startsWith(WORKSPACE_BASE + paths.sep) && absPath !== WORKSPACE_BASE) {
      return res.status(400).json({ message: 'Chemin non autorisé.' });
    }
    if (fs.existsSync(absPath)) {
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

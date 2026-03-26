const paths = require('path');
const storage = require('../../tools/storage');
const mime = require('mime-types');

exports.serveFile = async (req, res) => {
  const userId = res.locals.userId;
  const filePath = decodeURIComponent(req.params[0] || req.params.filePath || '');

  if (!filePath) {
    return res.status(400).json({ message: 'Chemin invalide.' });
  }

  const parts = filePath.split('/');
  if (parts[0] !== userId) {
    return res.status(403).json({ message: 'Accès non autorisé.' });
  }

  const relPath = paths.join('workspace', filePath);
  const mimeType = mime.lookup(filePath) || 'application/octet-stream';

  try {
    const stream = await storage.getFileStream(relPath);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${paths.basename(filePath)}"`);
    stream.pipe(res);
  } catch {
    res.status(404).json({ message: 'Fichier introuvable.' });
  }
};

const paths = require('path');
const jwt = require('jsonwebtoken');
const storage = require('../../tools/storage');
const mime = require('mime-types');
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');

exports.serveFile = async (req, res) => {
  let userId = res.locals.userId;
  const filePath = decodeURIComponent(req.params[0] || req.params.filePath || '');

  if (!filePath) {
    return res.status(400).json({ message: 'Chemin invalide.' });
  }

  // Accepter un token temporaire en query param (pour streaming video)
  if (!userId && req.query.token) {
    try {
      const decoded = jwt.verify(req.query.token, process.env.JWT_KEY || 'token');
      if (decoded.type === 'stream' && decoded.filePath === filePath) {
        userId = decoded.userId;
      } else {
        return res.status(403).json({ message: 'Token invalide.' });
      }
    } catch {
      return res.status(403).json({ message: 'Token expire ou invalide.' });
    }
  }

  if (!userId) {
    return res.status(401).json({ message: 'Non authentifie.' });
  }

  const parts = filePath.split('/');
  const fileOwnerId = parts[0];

  // Verifier l'acces : proprietaire ou fichier partage
  if (fileOwnerId !== userId) {
    const fileName = paths.basename(filePath);
    const subPath = parts.slice(1, -1).join('/');
    const shared = await WorkspaceFile.findOne({
      owner: fileOwnerId,
      path: subPath,
      name: fileName,
      'sharedWith.userId': userId,
    });
    if (!shared) {
      return res.status(403).json({ message: 'Acces non autorise.' });
    }
  }

  const relPath = paths.join('workspace', filePath);
  const mimeType = mime.lookup(filePath) || 'application/octet-stream';

  try {
    // Support Range requests pour le streaming video
    const range = req.headers.range;

    if (range) {
      const fileSize = await storage.getFileSize(relPath);
      const rangeMatch = range.match(/bytes=(\d+)-(\d*)/);
      if (!rangeMatch) {
        return res.status(416).json({ message: 'Range non valide.' });
      }

      const start = parseInt(rangeMatch[1], 10);
      const end = rangeMatch[2] ? parseInt(rangeMatch[2], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mimeType,
      });

      const stream = await storage.getPartialStream(relPath, start, chunkSize);
      stream.pipe(res);
    } else {
      // Pas de Range → servir le fichier entier
      const fileSize = await storage.getFileSize(relPath).catch(() => null);
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${paths.basename(filePath)}"`);
      res.setHeader('Accept-Ranges', 'bytes');
      if (fileSize) res.setHeader('Content-Length', fileSize);

      const stream = await storage.getFileStream(relPath);
      stream.pipe(res);
    }

    // Marquer comme recent (fire-and-forget)
    const fileName = paths.basename(filePath);
    const subPath = parts.slice(1, -1).join('/');
    WorkspaceFile.findOneAndUpdate(
      { owner: fileOwnerId, path: subPath, name: fileName },
      { lastAccessedAt: new Date() }
    ).catch(() => {});
  } catch {
    res.status(404).json({ message: 'Fichier introuvable.' });
  }
};

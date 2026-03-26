const paths = require('path');
const storage = require('../../tools/storage');
const mime = require('mime-types');
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');

exports.serveFile = async (req, res) => {
  const userId = res.locals.userId;
  const filePath = decodeURIComponent(req.params[0] || req.params.filePath || '');

  if (!filePath) {
    return res.status(400).json({ message: 'Chemin invalide.' });
  }

  const parts = filePath.split('/');
  const fileOwnerId = parts[0];

  // Vérifier l'accès : soit le propriétaire, soit un fichier partagé
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
      return res.status(403).json({ message: 'Accès non autorisé.' });
    }
  }

  const relPath = paths.join('workspace', filePath);
  const mimeType = mime.lookup(filePath) || 'application/octet-stream';

  try {
    const stream = await storage.getFileStream(relPath);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${paths.basename(filePath)}"`);
    stream.pipe(res);

    // Marquer comme récent (fire-and-forget)
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

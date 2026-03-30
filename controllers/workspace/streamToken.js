/**
 * Genere un token temporaire (60s) pour le streaming video/preview.
 * Le token est un JWT signe avec une courte duree de vie.
 *
 * POST /api/stuff/workspace/stream-token
 * Body: { filePath: "userId/Documents/video.mp4" }
 * Response: { token: "...", expiresIn: 60 }
 */

const jwt = require('jsonwebtoken');

exports.createStreamToken = async (req, res) => {
  const userId = res.locals.userId;
  const { filePath } = req.body;

  if (!filePath) {
    return res.status(400).json({ message: 'Chemin du fichier requis.' });
  }

  // Verifier que le user a acces au fichier (le path commence par son userId)
  const parts = filePath.split('/');
  const fileOwnerId = parts[0];

  if (fileOwnerId !== userId) {
    // Verifier si c'est un fichier partage
    const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
    const fileName = require('path').basename(filePath);
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

  // Generer un token temporaire (60 secondes)
  const streamToken = jwt.sign(
    { userId, filePath, type: 'stream' },
    process.env.JWT_KEY || 'token',
    { expiresIn: '60s' }
  );

  res.status(200).json({ token: streamToken, expiresIn: 60 });
};

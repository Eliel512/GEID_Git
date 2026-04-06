/**
 * serveFile — Sert un fichier chat depuis MinIO avec auth + Range requests.
 */

'use strict';

const paths = require('path');
const jwt = require('jsonwebtoken');
const storage = require('../../tools/storage');
const mime = require('mime-types');
const Chat = require('../../models/chats/chat.model');

exports.serveFile = async (req, res) => {
  let userId = res.locals.userId;
  const filePath = decodeURIComponent(req.params[0] || '');

  if (!filePath) {
    return res.status(400).json({ message: 'Chemin invalide.' });
  }

  // Token temporaire en query param (streaming vidéo)
  if (!userId && req.query.token) {
    try {
      const decoded = jwt.verify(req.query.token, process.env.TOKEN_KEY || 'token');
      if (decoded.type === 'stream' && decoded.filePath === filePath) {
        userId = decoded.userId;
      } else {
        return res.status(403).json({ message: 'Token invalide.' });
      }
    } catch {
      return res.status(403).json({ message: 'Token expiré ou invalide.' });
    }
  }

  if (!userId) {
    return res.status(401).json({ message: 'Non authentifié.' });
  }

  // Vérifier que l'utilisateur est membre du chat
  const chatId = filePath.split('/')[0];
  const isMember = await Chat.exists({
    _id: chatId,
    'members._id': userId,
  });

  if (!isMember) {
    return res.status(403).json({ message: 'Accès non autorisé.' });
  }

  const relPath = paths.posix.join('salon', filePath);
  const mimeType = mime.lookup(filePath) || 'application/octet-stream';

  try {
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
        'Cache-Control': 'private, max-age=3600',
      });

      const stream = await storage.getPartialStream(relPath, start, chunkSize);
      stream.pipe(res);
    } else {
      const fileSize = await storage.getFileSize(relPath).catch(() => null);
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${paths.basename(filePath)}"`);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'private, max-age=3600');
      if (fileSize) res.setHeader('Content-Length', fileSize);

      const stream = await storage.getFileStream(relPath);
      stream.pipe(res);
    }
  } catch {
    res.status(404).json({ message: 'Fichier introuvable.' });
  }
};

exports.streamToken = async (req, res) => {
  const userId = res.locals.userId;
  const { filePath } = req.body;

  if (!filePath || !userId) {
    return res.status(400).json({ message: 'Paramètres manquants.' });
  }

  const chatId = filePath.split('/')[0];
  const isMember = await Chat.exists({ _id: chatId, 'members._id': userId });
  if (!isMember) {
    return res.status(403).json({ message: 'Accès non autorisé.' });
  }

  const token = jwt.sign(
    { userId, filePath, type: 'stream' },
    process.env.TOKEN_KEY || 'token',
    { expiresIn: '60s' }
  );

  res.json({ token });
};

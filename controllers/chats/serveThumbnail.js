/**
 * serveThumbnail — Miniature d'un fichier chat via MinIO + geid-thumbgen.
 */

'use strict';

const paths = require('path');
const crypto = require('crypto');
const storage = require('../../tools/storage');
const Chat = require('../../models/chats/chat.model');
const { getThumbnail, getCachedThumbnail, isSupported } = require('../../tools/thumbnail');

exports.serveThumbnail = async (req, res) => {
  const userId = res.locals.userId;
  const filePath = decodeURIComponent(req.params[0] || '');

  if (!filePath) return res.status(400).json({ message: 'Chemin invalide.' });

  // Vérifier membership chat
  const chatId = filePath.split('/')[0];
  const isMember = await Chat.exists({ _id: chatId, 'members._id': userId });
  if (!isMember) return res.status(403).json({ message: 'Accès non autorisé.' });

  if (!isSupported(filePath)) return res.status(204).end();

  const quality = req.query.quality || 'medium';

  // ETag pour cache navigateur
  const etag = '"' + crypto.createHash('md5').update(filePath + quality).digest('hex') + '"';
  if (req.headers['if-none-match'] === etag) {
    return res.status(304).end();
  }

  res.setHeader('Cache-Control', 'public, max-age=604800');
  res.setHeader('ETag', etag);
  res.setHeader('Content-Type', 'image/webp');

  try {
    const relPath = paths.posix.join('salon', filePath);

    // 1. Cache MinIO d'abord
    const cached = await getCachedThumbnail(relPath, quality);
    if (cached) return res.end(cached);

    // 2. Lire le fichier source et générer
    let fileBuffer;
    try {
      const chunks = [];
      const stream = await storage.getFileStream(relPath);
      for await (const chunk of stream) chunks.push(chunk);
      fileBuffer = Buffer.concat(chunks);
    } catch {
      return res.status(204).end();
    }

    if (!fileBuffer || fileBuffer.length === 0) return res.status(204).end();

    const thumb = await getThumbnail(fileBuffer, paths.basename(filePath), relPath, quality);
    if (thumb) return res.end(thumb);

    res.status(204).end();
  } catch (err) {
    console.error('[chat/serveThumbnail]', err.message);
    res.status(204).end();
  }
};

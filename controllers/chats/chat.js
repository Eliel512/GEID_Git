const User = require('../../models/users/user.model');
const Message = require('../../models/chats/message.model');
const Chat = require('../../models/chats/chat.model');
const { updateChatHistory } = require('../../handlers/updates');
const mimeTypes = require('mime-types');

// ── Appel geid-thumbgen pour vidéo info ─────────────────────────────────────

const THUMB_URL = process.env.THUMB_SERVICE_URL || 'http://geid-thumbgen:9090';

function getVideoInfo(buffer, filename) {
  return new Promise((resolve) => {
    const http = require('http');
    const url = new URL(`${THUMB_URL}/video-info`);
    const boundary = '----FormBoundary' + Date.now().toString(36);

    const parts = [];
    // file part
    parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`);
    parts.push(buffer);
    parts.push(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="filename"\r\n\r\n${filename}\r\n--${boundary}--\r\n`);

    const body = Buffer.concat(parts.map(p => typeof p === 'string' ? Buffer.from(p) : p));

    const req = http.request({
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
      timeout: 30000,
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString()));
        } catch { resolve({}); }
      });
    });

    req.on('error', () => resolve({}));
    req.on('timeout', () => { req.destroy(); resolve({}); });
    req.write(body);
    req.end();
  });
}

// ── Extraction des métadonnées fichier ──────────────────────────────────────

async function getFileDetails(buffer, filename, subtype) {
  const details = {};
  const ext = (filename.split('.').pop() || '').toLowerCase();
  const imageExts = ['jpg','jpeg','png','webp','gif','bmp','avif','tiff'];
  const videoExts = ['mp4','webm','mov','avi','mkv'];

  try {
    if (subtype === 'image' || imageExts.includes(ext)) {
      const sharp = require('sharp');
      const meta = await sharp(buffer).metadata();
      if (meta.width && meta.height) {
        details.width = meta.width;
        details.height = meta.height;
      }
    } else if (subtype === 'video' || videoExts.includes(ext)) {
      const info = await getVideoInfo(buffer, filename);
      if (info.width) details.width = info.width;
      if (info.height) details.height = info.height;
      if (info.durationSeconds) details.duration = info.durationSeconds;
    }
  } catch (err) {
    console.error('[getFileDetails]', err.message);
  }

  if (buffer) {
    details.size = buffer.length;
  }

  return Object.keys(details).length > 0 ? details : undefined;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function findOrCreateDirectChat(userId, to) {
  let userContacts = await User.findOne({ _id: userId }, { contacts: 1 });
  if (!userContacts?.contacts?.includes(to)) {
    return { error: { status: 404, message: 'Cet utilisateur ne fait pas partie de vos contacts' } };
  }

  let chat = await Chat.findOne({
    "members._id": { $all: [userId, to] },
    type: 'direct'
  });

  if (!chat) {
    chat = new Chat({
      members: [
        { _id: userId, role: 'simple' },
        { _id: to, role: 'simple' }
      ],
      messages: [],
      type: 'direct'
    });
    await chat.save();
  }

  return { chat };
}

async function saveMessageToChat(chat, messageData) {
  const message = new Message(messageData);
  await message.save();
  chat.messages.push(message._id);
  await chat.save();
  updateChatHistory(chat._id.toString());
  return message;
}

// ── Controllers ─────────────────────────────────────────────────────────────

module.exports = {
  sendDirectFile: async (req, res) => {
    try {
      const userId = res.locals.userId;
      const to = req.body.to;

      if (new Date(req.body.date) == 'Invalid Date') {
        return res.status(400).json({ message: 'La date est incorrecte.' });
      }

      const { chat, error } = await findOrCreateDirectChat(userId, to);
      if (error) return res.status(error.status).json({ message: error.message });

      const content = `salon/${chat._id}/${req.file.filename}`;
      const details = await getFileDetails(req.file.buffer, req.file.filename, 'image');

      await saveMessageToChat(chat, {
        content,
        ref: req.body.ref,
        type: req.body.fileType || 'media',
        subtype: req.body.subtype,
        sender: userId,
        createdAt: req.body.date,
        clientId: req.body.clientId,
        details,
      });

      res.status(201).json({ message: 'Fichier envoyé avec succès!' });
    } catch (err) {
      console.error('[sendDirectFile]', err);
      res.status(500).json({ message: 'Une erreur est survenue, veuillez réessayer.' });
    }
  },

  sendFile: async (req, res) => {
    try {
      const userId = res.locals.userId;
      const to = req.body.to;
      let query;

      switch (req.body.type) {
        case 'direct': {
          const { chat: directChat, error } = await findOrCreateDirectChat(userId, to);
          if (error) return res.status(error.status).json({ message: error.message });
          query = { _id: directChat._id };
          break;
        }
        case 'room': {
          const chatExists = await Chat.exists({
            _id: to,
            type: 'room',
            "members._id": userId
          });
          if (!chatExists) return res.status(404).json({ message: 'Chat introuvable.' });
          query = { _id: to };
          break;
        }
        default:
          return res.status(400).json({ message: '\'type\' incorrect.' });
      }

      if (new Date(req.body.date) == 'Invalid Date') {
        return res.status(400).json({ message: 'La date est incorrecte.' });
      }

      const chat = await Chat.findOne(query);
      if (!chat) {
        return res.status(500).json({ message: 'Une erreur est survenue, veuillez réessayer.' });
      }

      const content = `salon/${chat._id}/${req.file.filename}`;
      const fileType = req.body.fileType;
      const subtype = fileType === 'doc'
        ? mimeTypes.lookup(req.file.filename) || 'AUTRE'
        : req.body.subtype;

      const details = await getFileDetails(req.file.buffer, req.file.filename, subtype);

      await saveMessageToChat(chat, {
        content,
        ref: req.body.ref,
        type: fileType,
        subtype,
        sender: userId,
        createdAt: req.body.date,
        clientId: req.body.clientId,
        details,
      });

      res.status(201).json({ message: 'Fichier(s) envoyé(s) avec succès!' });
    } catch (err) {
      console.error('[sendFile]', err);
      res.status(500).json({ message: 'Une erreur est survenue, veuillez réessayer.' });
    }
  },

  rejectInvite: async (req, res) => {},
  acceptInvite: async (req, res) => {},
  getInvite: async (req, res) => {}
};

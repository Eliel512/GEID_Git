#!/usr/bin/env node
/**
 * Migration : ajouter width/height/duration dans details des messages media/voice
 *
 * Parcourt tous les messages de type media (IMAGE/VIDEO) qui n'ont pas de details,
 * lit le fichier depuis MinIO, extrait les métadonnées et met à jour le message.
 *
 * Usage: node scripts/migrate-message-details.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Message = require('../models/chats/message.model');
const storage = require('../tools/storage');
const sharp = require('sharp');
const http = require('http');

const THUMB_URL = process.env.THUMB_SERVICE_URL || 'http://geid-thumbgen:9090';

async function connectDB() {
  const uri = process.env.MONGO_URI || process.env.DB_HOST || 'mongodb://geid-mongo:27017/test';
  await mongoose.connect(uri);
  console.log('[migration] MongoDB connecté');
}

function getVideoInfo(buffer, filename) {
  return new Promise((resolve) => {
    const url = new URL(`${THUMB_URL}/video-info`);
    const boundary = '----FormBoundary' + Date.now().toString(36);
    const parts = [];
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
      timeout: 60000,
    }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString())); }
        catch { resolve({}); }
      });
    });
    req.on('error', () => resolve({}));
    req.on('timeout', () => { req.destroy(); resolve({}); });
    req.write(body);
    req.end();
  });
}

async function getFileBuffer(relativePath) {
  try {
    const chunks = [];
    const stream = await storage.getFileStream(relativePath);
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
  } catch {
    return null;
  }
}

async function processMessage(msg) {
  const content = msg.content;
  if (!content || !content.startsWith('salon/')) return null;

  const filename = content.split('/').pop();
  const ext = (filename.split('.').pop() || '').toLowerCase();
  const details = {};

  const buffer = await getFileBuffer(content);
  if (!buffer || buffer.length === 0) return null;

  details.size = buffer.length;

  const imageExts = ['jpg','jpeg','png','webp','gif','bmp','avif','tiff'];
  const videoExts = ['mp4','webm','mov','avi','mkv'];

  try {
    if (msg.subtype === 'IMAGE' || imageExts.includes(ext)) {
      const meta = await sharp(buffer).metadata();
      if (meta.width && meta.height) {
        details.width = meta.width;
        details.height = meta.height;
      }
    } else if (msg.subtype === 'VIDEO' || videoExts.includes(ext)) {
      const info = await getVideoInfo(buffer, filename);
      if (info.width) details.width = info.width;
      if (info.height) details.height = info.height;
      if (info.durationSeconds) details.duration = info.durationSeconds;
    }
  } catch (err) {
    console.error(`  [erreur] ${msg._id}:`, err.message);
    return null;
  }

  if (details.width || details.duration) return details;
  return null;
}

async function main() {
  await connectDB();

  if (!storage.MINIO_ENABLED) {
    console.error('MINIO_ENDPOINT non défini — migration impossible.');
    process.exit(1);
  }

  // Trouver tous les messages media/voice sans details
  const messages = await Message.find({
    type: { $in: ['media', 'voice'] },
    $or: [
      { details: null },
      { details: { $exists: false } },
      { 'details.width': { $exists: false } },
    ],
    content: { $regex: /^salon\// },
  }).lean();

  console.log(`[migration] ${messages.length} messages à traiter\n`);

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    try {
      const details = await processMessage(msg);
      if (details) {
        await Message.updateOne({ _id: msg._id }, { $set: { details } });
        updated++;
      } else {
        skipped++;
      }
    } catch {
      errors++;
    }

    if ((i + 1) % 10 === 0 || i === messages.length - 1) {
      console.log(`  [${i + 1}/${messages.length}] ${updated} mis à jour, ${skipped} ignorés, ${errors} erreurs`);
    }
  }

  console.log(`\n[migration] Terminé: ${updated} mis à jour, ${skipped} ignorés, ${errors} erreurs`);
  process.exit(0);
}

main().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});

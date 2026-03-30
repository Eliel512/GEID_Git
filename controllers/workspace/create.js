const paths = require('path');
const http = require('http');
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const ActivityLog = require('../../models/workspace/activityLog.model');
const storage = require('../../tools/storage');
const getHost = require('../getHost').getHost();
const { listFromDB } = require('./utils');

const THUMB_SERVICE = process.env.THUMB_SERVICE_URL || 'http://geid-thumbgen:9090';
const VIDEO_EXTS = new Set(['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'mpg', 'mpeg', 'mxf']);

exports.create = async (req, res) => {
  const userId = res.locals.userId;
  if (!req.file) {
    return res.status(400).json({ message: 'Aucun fichier fourni.' });
  }

  const subPath = req.body.path || '';
  const filename = req.file.filename;
  const ext = paths.extname(filename).slice(1).toLowerCase();
  const parts = ['workspace', userId, subPath, filename].filter(Boolean);
  const contentRelPath = parts.join('/');

  try {
    // Tags optionnels depuis le formulaire
    let tags = [];
    if (req.body.tags) {
      try { tags = typeof req.body.tags === 'string' ? req.body.tags.split(/[\s,]+/).filter(Boolean) : req.body.tags; }
      catch { tags = []; }
    }

    const wsFile = new WorkspaceFile({
      name: filename,
      owner: userId,
      path: subPath,
      isDirectory: false,
      format: ext,
      size: req.file.size,
      mimeType: req.file.mimetype,
      contentUrl: contentRelPath,
      tags,
      description: req.body.description || '',
      designation: req.body.designation || '',
      docType: req.body.type || '',
      docSubType: req.body.subType || '',
    });
    await wsFile.save();

    // Activity log
    new ActivityLog({
      userId,
      action: 'upload',
      targetId: wsFile._id,
      targetName: filename,
    }).save().catch(() => {});

    // Pour les vidéos : extraire la durée en arrière-plan
    if (VIDEO_EXTS.has(ext) && req.file.buffer) {
      extractDuration(wsFile._id, req.file.buffer, filename).catch(() => {});
    }

    const result = await listFromDB(userId, subPath, getHost);
    res.status(201).json(result);
  } catch (error) {
    console.error('[workspace.create]', error);
    res.status(500).json({ message: 'Impossible de sauvegarder le fichier.' });
  }
};

/** Extrait la durée d'une vidéo via le micro-service Python (fire-and-forget) */
async function extractDuration(fileId, buffer, filename) {
  return new Promise((resolve) => {
    try {
      const boundary = '----DurBoundary' + Date.now();
      const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`;
      const fieldPart = `\r\n--${boundary}\r\nContent-Disposition: form-data; name="filename"\r\n\r\n${filename}\r\n--${boundary}--\r\n`;
      const body = Buffer.concat([Buffer.from(header), buffer, Buffer.from(fieldPart)]);

      const url = new URL(`${THUMB_SERVICE}/video-info`);
      const proxyReq = http.request({
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length,
        },
        timeout: 60000,
      }, (proxyRes) => {
        const chunks = [];
        proxyRes.on('data', (c) => chunks.push(c));
        proxyRes.on('end', async () => {
          try {
            const info = JSON.parse(Buffer.concat(chunks).toString());
            const update = {};
            if (info.duration) update.duration = info.duration;
            if (info.durationSeconds) update.durationSeconds = info.durationSeconds;
            if (info.width) update.videoWidth = info.width;
            if (info.height) update.videoHeight = info.height;
            if (Object.keys(update).length) {
              await WorkspaceFile.findByIdAndUpdate(fileId, update);
            }
          } catch {}
          resolve();
        });
      });
      proxyReq.on('error', () => resolve());
      proxyReq.on('timeout', () => { proxyReq.destroy(); resolve(); });
      proxyReq.write(body);
      proxyReq.end();
    } catch { resolve(); }
  });
}

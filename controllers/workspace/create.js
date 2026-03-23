const fs = require('fs');
const paths = require('path');
const mime = require('mime-types');
const Doc = require('../../models/archives/doc.model');
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const ActivityLog = require('../../models/workspace/activityLog.model');
const getHost = require('../getHost').getHost();
const storage = require('../../tools/storage');
const docEvent = require('../../events/doc');
const { listDirectory, WORKSPACE_BASE, safePath } = require('./utils');

exports.create = (req, res) => {
  const userId = res.locals.userId;
  const extension = mime.extension(req.file.mimetype);
  const filename = req.body.filename + '.' + extension;
  const { path: subPath } = req.body;

  fs.access(`./workspace/${userId}/${subPath}/${filename}`, err => {
    if (err) {
      return res.status(500).json({ message: 'Erreur interne du serveur' });
    }

    const contentRelPath = paths.join('workspace', userId, subPath, filename);
    const localAbsPath = paths.resolve('./workspace', userId, subPath, filename);

    // Dual-write: upload to MinIO
    storage.uploadFileFromDisk(contentRelPath, localAbsPath).catch(err2 => {
      console.error('[MinIO upload] workspace.create:', err2.message);
    });

    const doc = new Doc({
      ...req.body,
      format: extension,
      owner: userId,
      contentUrl: contentRelPath,
    });

    doc.save()
      .then(async () => {
        docEvent.emit('create', {
          _id: doc._id,
          format: doc.format,
          contentUrl: doc.contentUrl,
          author: userId,
        });

        // Create WorkspaceFile record
        let stat;
        try { stat = fs.statSync(localAbsPath); } catch { stat = null; }

        const wsFile = new WorkspaceFile({
          name: filename,
          owner: userId,
          path: subPath,
          isDirectory: false,
          format: extension,
          size: stat ? stat.size : 0,
          mimeType: req.file.mimetype,
          contentUrl: contentRelPath,
          lastAccessedAt: new Date(),
        });
        await wsFile.save().catch(() => {});

        // Activity log
        new ActivityLog({
          userId,
          action: 'upload',
          targetId: wsFile._id,
          targetName: filename,
        }).save().catch(() => {});

        // Emit socket event
        const io = require('../../socketStore').getInstance();
        if (io) {
          io.emit('workspace:file-created', { file: { name: filename, path: subPath }, userId });
        }

        try {
          const result = await listDirectory(
            safePath(WORKSPACE_BASE, userId, subPath) || `./workspace/${userId}/${subPath}`,
            userId, subPath, getHost
          );
          res.status(201).json(result);
        } catch {
          res.status(201).json([]);
        }
      })
      .catch(() => {
        res.status(500).json({ message: 'Une erreur est survenue' });
      });
  });
};

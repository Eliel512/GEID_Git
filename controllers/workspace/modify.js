const fs = require('fs');
const paths = require('path');
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const ActivityLog = require('../../models/workspace/activityLog.model');
const getHost = require('../getHost').getHost();
const storage = require('../../tools/storage');
const { listDirectory, WORKSPACE_BASE, safePath } = require('./utils');

exports.modify = (req, res) => {
  const userId = res.locals.userId;
  const extension = paths.extname(req.body.oldFilename);
  const filename = req.body.filename.split(' ').join('_') + extension;
  const { path: subPath } = req.body;

  fs.rename(
    `./workspace/${userId}/${subPath}/${req.body.oldFilename}`,
    `./workspace/${req.body.userId}/${req.body.path}/${filename}`,
    async (err) => {
      if (err) {
        return res.status(500).json({ message: 'Erreur interne du serveur' });
      }

      // Dual-write: rename in MinIO
      const oldRelPath = paths.join('workspace', userId, subPath, req.body.oldFilename);
      const newRelPath = paths.join('workspace', req.body.userId, req.body.path, filename);
      storage.renameFile(oldRelPath, newRelPath).catch(err2 => {
        console.error('[MinIO rename] workspace.modify:', err2.message);
      });

      // Update WorkspaceFile record
      await WorkspaceFile.findOneAndUpdate(
        { owner: userId, path: subPath, name: req.body.oldFilename },
        { name: filename, contentUrl: newRelPath }
      ).catch(() => {});

      // Activity log
      new ActivityLog({
        userId,
        action: 'rename',
        targetName: filename,
        details: { oldName: req.body.oldFilename, newName: filename },
      }).save().catch(() => {});

      // Emit socket event
      const io = require('../../socketStore').getInstance();
      if (io) {
        io.emit('workspace:file-renamed', {
          userId,
          oldName: req.body.oldFilename,
          newName: filename,
          path: subPath,
        });
      }

      try {
        const targetDir = safePath(WORKSPACE_BASE, userId, subPath);
        const result = await listDirectory(targetDir || `./workspace/${userId}/${subPath}`, userId, subPath, getHost);
        res.status(200).json(result);
      } catch {
        res.status(200).json([]);
      }
    }
  );
};

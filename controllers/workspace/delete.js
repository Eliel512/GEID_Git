const fs = require('fs');
const paths = require('path');
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const ActivityLog = require('../../models/workspace/activityLog.model');
const getHost = require('../getHost').getHost();
const storage = require('../../tools/storage');
const { WORKSPACE_BASE, safePath, listDirectory } = require('./utils');

exports.delete = (req, res) => {
  const userId = res.locals.userId;
  let parsed;
  try {
    parsed = JSON.parse(req.params.data);
  } catch {
    return res.status(400).json({ message: 'Paramètre invalide.' });
  }
  const subPath = parsed["path"];
  const filename = parsed["filename"];

  if (!subPath || !filename || typeof subPath !== 'string' || typeof filename !== 'string') {
    return res.status(400).json({ message: 'Paramètre invalide.' });
  }

  const targetDir  = safePath(WORKSPACE_BASE, userId, subPath);
  const targetFile = targetDir && safePath(WORKSPACE_BASE, userId, subPath, filename);
  if (!targetDir || !targetFile) {
    return res.status(400).json({ message: 'Chemin non autorisé.' });
  }

  fs.unlink(targetFile, async (err) => {
    if (err) {
      return res.status(500).json({ message: 'Une erreur est survenue' });
    }

    // Dual-write: delete from MinIO
    const delRelPath = paths.join('workspace', userId, subPath, filename);
    storage.deleteFile(delRelPath).catch(err2 => {
      console.error('[MinIO delete] workspace.delete:', err2.message);
    });

    // Mark as trashed in WorkspaceFile (soft delete) or remove
    await WorkspaceFile.findOneAndDelete(
      { owner: userId, path: subPath, name: filename }
    ).catch(() => {});

    // Activity log
    new ActivityLog({
      userId,
      action: 'delete',
      targetName: filename,
      details: { path: subPath },
    }).save().catch(() => {});

    // Emit socket event
    const io = require('../../socketStore').getInstance();
    if (io) {
      io.emit('workspace:file-deleted', { userId, fileName: filename, path: subPath });
    }

    try {
      const result = await listDirectory(targetDir, userId, subPath, getHost);
      res.status(200).json(result);
    } catch {
      res.status(200).json([]);
    }
  });
};

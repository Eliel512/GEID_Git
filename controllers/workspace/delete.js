const paths = require('path');
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const ActivityLog = require('../../models/workspace/activityLog.model');
const getHost = require('../getHost').getHost();
const storage = require('../../tools/storage');
const { listFromDB } = require('./utils');

exports.delete = async (req, res) => {
  const userId = res.locals.userId;
  let parsed;
  try {
    parsed = JSON.parse(req.params.data);
  } catch {
    return res.status(400).json({ message: 'Paramètre invalide.' });
  }
  const subPath = typeof parsed['path'] === 'string' ? parsed['path'] : '';
  const filename = parsed['filename'];

  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ message: 'Paramètre invalide.' });
  }

  try {
    // Delete from MinIO
    const parts = ['workspace', userId, subPath, filename].filter(Boolean);
    const relPath = parts.join('/');
    storage.deleteFile(relPath).catch(err => {
      console.error('[MinIO delete] workspace.delete:', err.message);
    });

    // Remove from MongoDB
    await WorkspaceFile.findOneAndDelete(
      { owner: userId, path: subPath, name: filename }
    );

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

    const result = await listFromDB(userId, subPath, getHost);
    res.status(200).json(result);
  } catch (error) {
    console.error('[workspace.delete]', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du fichier.' });
  }
};

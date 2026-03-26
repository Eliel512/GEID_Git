const paths = require('path');
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const ActivityLog = require('../../models/workspace/activityLog.model');
const getHost = require('../getHost').getHost();
const storage = require('../../tools/storage');
const { listFromDB } = require('./utils');

exports.modify = async (req, res) => {
  const userId = res.locals.userId;
  const extension = paths.extname(req.body.oldFilename);
  const filename = req.body.filename.split(' ').join('_') + extension;
  const subPath = req.body.path || '';

  try {
    // Rename in MinIO
    const oldParts = ['workspace', userId, subPath, req.body.oldFilename].filter(Boolean);
    const newParts = ['workspace', userId, subPath, filename].filter(Boolean);
    const oldRelPath = oldParts.join('/');
    const newRelPath = newParts.join('/');

    await storage.renameFile(oldRelPath, newRelPath);

    // Update WorkspaceFile record
    await WorkspaceFile.findOneAndUpdate(
      { owner: userId, path: subPath, name: req.body.oldFilename },
      { name: filename, contentUrl: newRelPath }
    );

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

    const result = await listFromDB(userId, subPath, getHost);
    res.status(200).json(result);
  } catch (error) {
    console.error('[workspace.modify]', error);
    res.status(500).json({ message: 'Erreur lors du renommage du fichier.' });
  }
};

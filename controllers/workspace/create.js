const paths = require('path');
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const ActivityLog = require('../../models/workspace/activityLog.model');
const getHost = require('../getHost').getHost();
const { listFromDB } = require('./utils');

exports.create = async (req, res) => {
  const userId = res.locals.userId;
  if (!req.file) {
    return res.status(400).json({ message: 'Aucun fichier fourni.' });
  }

  const subPath = req.body.path || '';
  const filename = req.file.filename;
  const parts = ['workspace', userId, subPath, filename].filter(Boolean);
  const contentRelPath = parts.join('/');

  try {
    // Create WorkspaceFile record
    const wsFile = new WorkspaceFile({
      name: filename,
      owner: userId,
      path: subPath,
      isDirectory: false,
      format: paths.extname(filename).slice(1),
      size: req.file.size,
      mimeType: req.file.mimetype,
      contentUrl: contentRelPath,
    });
    await wsFile.save();

    // Activity log
    new ActivityLog({
      userId,
      action: 'upload',
      targetId: wsFile._id,
      targetName: filename,
    }).save().catch(() => {});

    // Return updated directory listing
    const result = await listFromDB(userId, subPath, getHost);
    res.status(201).json(result);
  } catch (error) {
    console.error('[workspace.create]', error);
    res.status(500).json({ message: 'Impossible de sauvegarder le fichier.' });
  }
};

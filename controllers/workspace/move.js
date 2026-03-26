const paths = require('path');
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const ActivityLog = require('../../models/workspace/activityLog.model');
const storage = require('../../tools/storage');

exports.moveFile = async (req, res) => {
  const userId = res.locals.userId;
  const { fileId, destinationPath } = req.body;

  if (!fileId || typeof destinationPath !== 'string') {
    return res.status(400).json({ message: 'Paramètres invalides.' });
  }

  try {
    const file = await WorkspaceFile.findOne({ _id: fileId, owner: userId });
    if (!file) return res.status(404).json({ message: 'Fichier introuvable.' });

    // Move in MinIO
    const oldParts = ['workspace', userId, file.path, file.name].filter(Boolean);
    const newParts = ['workspace', userId, destinationPath, file.name].filter(Boolean);
    const oldRelPath = oldParts.join('/');
    const newRelPath = newParts.join('/');

    await storage.renameFile(oldRelPath, newRelPath);

    const oldPath = file.path;
    file.path = destinationPath;
    file.contentUrl = newRelPath;
    await file.save();

    new ActivityLog({
      userId,
      action: 'move',
      targetId: file._id,
      targetName: file.name,
      details: { from: oldPath, to: destinationPath },
    }).save().catch(() => {});

    const io = require('../../socketStore').getInstance();
    if (io) {
      io.emit('workspace:file-moved', {
        userId, fileId: file._id, fileName: file.name,
        fromPath: oldPath, toPath: destinationPath,
      });
    }

    res.status(200).json({ message: 'Fichier déplacé.', file });
  } catch (err) {
    console.error('[workspace.move]', err);
    res.status(500).json({ message: 'Erreur lors du déplacement.' });
  }
};

exports.copyFile = async (req, res) => {
  const userId = res.locals.userId;
  const { fileId, destinationPath } = req.body;

  if (!fileId || typeof destinationPath !== 'string') {
    return res.status(400).json({ message: 'Paramètres invalides.' });
  }

  try {
    const file = await WorkspaceFile.findOne({ _id: fileId, owner: userId });
    if (!file) return res.status(404).json({ message: 'Fichier introuvable.' });

    // Copy in MinIO
    const srcParts = ['workspace', userId, file.path, file.name].filter(Boolean);
    const destParts = ['workspace', userId, destinationPath, file.name].filter(Boolean);
    const srcRelPath = srcParts.join('/');
    const destRelPath = destParts.join('/');

    await storage.copyFile(srcRelPath, destRelPath);

    const copy = new WorkspaceFile({
      name: file.name,
      owner: userId,
      path: destinationPath,
      isDirectory: false,
      format: file.format,
      size: file.size,
      mimeType: file.mimeType,
      contentUrl: destRelPath,
      tags: file.tags,
    });
    await copy.save();

    new ActivityLog({
      userId,
      action: 'copy',
      targetId: copy._id,
      targetName: file.name,
      details: { from: file.path, to: destinationPath },
    }).save().catch(() => {});

    res.status(201).json({ message: 'Fichier copié.', file: copy });
  } catch (err) {
    console.error('[workspace.copy]', err);
    res.status(500).json({ message: 'Erreur lors de la copie.' });
  }
};

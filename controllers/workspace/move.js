const fs = require('fs');
const paths = require('path');
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const ActivityLog = require('../../models/workspace/activityLog.model');
const storage = require('../../tools/storage');
const { WORKSPACE_BASE, safePath } = require('./utils');

exports.moveFile = async (req, res) => {
  const userId = res.locals.userId;
  const { fileId, destinationPath } = req.body;

  if (!fileId || !destinationPath) {
    return res.status(400).json({ message: 'Paramètres invalides.' });
  }

  try {
    const file = await WorkspaceFile.findOne({ _id: fileId, owner: userId });
    if (!file) return res.status(404).json({ message: 'Fichier introuvable.' });

    const oldDir = safePath(WORKSPACE_BASE, userId, file.path);
    const newDir = safePath(WORKSPACE_BASE, userId, destinationPath);
    if (!oldDir || !newDir) {
      return res.status(400).json({ message: 'Chemin non autorisé.' });
    }

    // Ensure destination exists
    fs.mkdirSync(newDir, { recursive: true });

    const oldFullPath = paths.join(oldDir, file.name);
    const newFullPath = paths.join(newDir, file.name);

    fs.renameSync(oldFullPath, newFullPath);

    // MinIO dual-write
    const oldRelPath = paths.join('workspace', userId, file.path, file.name);
    const newRelPath = paths.join('workspace', userId, destinationPath, file.name);
    storage.renameFile(oldRelPath, newRelPath).catch(() => {});

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

    // Emit socket event
    const io = require('../../socketStore').getInstance();
    if (io) {
      io.emit('workspace:file-moved', {
        userId,
        fileId: file._id,
        fileName: file.name,
        fromPath: oldPath,
        toPath: destinationPath,
      });
    }

    res.status(200).json({ message: 'Fichier déplacé.', file });
  } catch (err) {
    if (err.code === 'ENOENT') return res.status(404).json({ message: 'Fichier ou dossier introuvable.' });
    res.status(500).json({ message: 'Erreur lors du déplacement.' });
  }
};

exports.copyFile = async (req, res) => {
  const userId = res.locals.userId;
  const { fileId, destinationPath } = req.body;

  if (!fileId || !destinationPath) {
    return res.status(400).json({ message: 'Paramètres invalides.' });
  }

  try {
    const file = await WorkspaceFile.findOne({ _id: fileId, owner: userId });
    if (!file) return res.status(404).json({ message: 'Fichier introuvable.' });

    const srcDir = safePath(WORKSPACE_BASE, userId, file.path);
    const destDir = safePath(WORKSPACE_BASE, userId, destinationPath);
    if (!srcDir || !destDir) {
      return res.status(400).json({ message: 'Chemin non autorisé.' });
    }

    fs.mkdirSync(destDir, { recursive: true });

    const srcFullPath = paths.join(srcDir, file.name);
    const destFullPath = paths.join(destDir, file.name);

    fs.copyFileSync(srcFullPath, destFullPath);

    // MinIO dual-write
    const srcRelPath = paths.join('workspace', userId, file.path, file.name);
    const destRelPath = paths.join('workspace', userId, destinationPath, file.name);
    storage.copyFile(srcRelPath, destRelPath).catch(() => {});

    // Create new WorkspaceFile record for the copy
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
    if (err.code === 'ENOENT') return res.status(404).json({ message: 'Fichier introuvable.' });
    res.status(500).json({ message: 'Erreur lors de la copie.' });
  }
};

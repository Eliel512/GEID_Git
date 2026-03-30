const paths = require('path');
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const ActivityLog = require('../../models/workspace/activityLog.model');
const storage = require('../../tools/storage');
const { isValidFolderName, escapeRegex } = require('./utils');

exports.createFolder = async (req, res) => {
  const userId = res.locals.userId;
  const { path: subPath, folderName, color } = req.body;

  if (!folderName || typeof folderName !== 'string' || typeof subPath !== 'string') {
    return res.status(400).json({ message: 'Paramètres invalides.' });
  }
  if (!isValidFolderName(folderName)) {
    return res.status(400).json({ message: 'Nom de dossier invalide.' });
  }

  const trimmedName = folderName.trim();
  const normalizedPath = subPath || '';

  try {
    // Check if folder already exists in DB
    const existing = await WorkspaceFile.findOne({
      owner: userId,
      path: normalizedPath,
      name: trimmedName,
      isDirectory: true,
      isTrashed: { $ne: true },
    });
    if (existing) {
      return res.status(409).json({ message: 'Ce dossier existe déjà.' });
    }

    // Create WorkspaceFile record for the folder
    const folderDoc = { name: trimmedName, owner: userId, path: normalizedPath, isDirectory: true };
    if (color && typeof color === 'string') folderDoc.color = color;
    await new WorkspaceFile(folderDoc).save();

    // Activity log
    new ActivityLog({
      userId,
      action: 'create',
      targetName: trimmedName,
      details: { path: normalizedPath, isDirectory: true },
    }).save().catch(() => {});

    // Emit socket event
    const io = require('../../socketStore').getInstance();
    if (io) {
      io.emit('workspace:folder-created', { folder: trimmedName, path: normalizedPath, userId });
    }

    res.status(201).json({ message: 'Dossier créé', name: trimmedName, isDirectory: true });
  } catch (error) {
    console.error('[workspace.createFolder]', error);
    res.status(500).json({ message: 'Une erreur est survenue lors de la création du dossier.' });
  }
};

exports.deleteFolder = async (req, res) => {
  const userId = res.locals.userId;
  let parsed;
  try {
    parsed = JSON.parse(req.params.data);
  } catch {
    return res.status(400).json({ message: 'Paramètre invalide.' });
  }
  const { path: subPath, folderName } = parsed;

  if (!folderName || typeof folderName !== 'string' || typeof subPath !== 'string') {
    return res.status(400).json({ message: 'Paramètres invalides.' });
  }

  const normalizedPath = subPath || '';

  try {
    // Verify folder exists in DB
    const folder = await WorkspaceFile.findOne({
      owner: userId,
      path: normalizedPath,
      name: folderName,
      isDirectory: true,
      isTrashed: { $ne: true },
    });
    if (!folder) {
      return res.status(404).json({ message: 'Dossier introuvable.' });
    }

    // Delete from MinIO
    const minioParts = ['workspace', userId, normalizedPath, folderName].filter(Boolean);
    storage.deleteDir(minioParts.join('/')).catch(() => {});

    // Remove WorkspaceFile records for the folder and its children
    const folderPath = normalizedPath ? normalizedPath + '/' + folderName : folderName;
    await WorkspaceFile.deleteMany({
      owner: userId,
      $or: [
        { path: normalizedPath, name: folderName, isDirectory: true },
        { path: { $regex: `^${escapeRegex(folderPath)}(/|$)` } },
      ],
    });

    // Activity log
    new ActivityLog({
      userId,
      action: 'delete',
      targetName: folderName,
      details: { path: normalizedPath, isDirectory: true },
    }).save().catch(() => {});

    // Emit socket event
    const io = require('../../socketStore').getInstance();
    if (io) {
      io.emit('workspace:folder-deleted', { folderName, path: normalizedPath, userId });
    }

    res.status(200).json({ message: 'Dossier supprimé' });
  } catch (error) {
    console.error('[workspace.deleteFolder]', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du dossier.' });
  }
};

exports.renameFolder = async (req, res) => {
  const userId = res.locals.userId;
  const { path: subPath, oldName, newName } = req.body;

  if (!oldName || !newName || typeof subPath !== 'string') {
    return res.status(400).json({ message: 'Paramètres invalides.' });
  }
  if (!isValidFolderName(newName)) {
    return res.status(400).json({ message: 'Nom de dossier invalide.' });
  }

  const normalizedPath = subPath || '';
  const trimmedOld = oldName.trim();
  const trimmedNew = newName.trim();

  try {
    // Check that the old folder exists
    const folder = await WorkspaceFile.findOne({
      owner: userId,
      path: normalizedPath,
      name: trimmedOld,
      isDirectory: true,
      isTrashed: { $ne: true },
    });
    if (!folder) {
      return res.status(404).json({ message: 'Dossier introuvable.' });
    }

    // Check that the new name doesn't already exist
    const conflict = await WorkspaceFile.findOne({
      owner: userId,
      path: normalizedPath,
      name: trimmedNew,
      isDirectory: true,
      isTrashed: { $ne: true },
    });
    if (conflict) {
      return res.status(409).json({ message: 'Un dossier avec ce nom existe déjà.' });
    }

    // Rename in MinIO
    const oldMinioPath = ['workspace', userId, normalizedPath, trimmedOld].filter(Boolean).join('/');
    const newMinioPath = ['workspace', userId, normalizedPath, trimmedNew].filter(Boolean).join('/');
    storage.renameDirPrefix(oldMinioPath, newMinioPath).catch(() => {});

    // Update the folder record itself
    await WorkspaceFile.findByIdAndUpdate(folder._id, { name: trimmedNew });

    // Update all children whose path starts with the old folder path
    const oldChildPath = normalizedPath ? normalizedPath + '/' + trimmedOld : trimmedOld;
    const newChildPath = normalizedPath ? normalizedPath + '/' + trimmedNew : trimmedNew;

    // Update direct children (path === oldChildPath)
    await WorkspaceFile.updateMany(
      { owner: userId, path: oldChildPath },
      { path: newChildPath }
    );

    // Update nested children (path starts with oldChildPath/)
    const prefix = oldChildPath + '/';
    const children = await WorkspaceFile.find({
      owner: userId,
      path: { $regex: `^${escapeRegex(prefix)}` },
    });
    for (const child of children) {
      const updatedPath = newChildPath + '/' + child.path.slice(prefix.length);
      await WorkspaceFile.findByIdAndUpdate(child._id, { path: updatedPath });
    }

    // Activity log
    new ActivityLog({
      userId,
      action: 'rename',
      targetName: trimmedNew,
      details: { oldName: trimmedOld, newName: trimmedNew, isDirectory: true },
    }).save().catch(() => {});

    res.status(200).json({ message: 'Dossier renommé', name: trimmedNew });
  } catch (error) {
    console.error('[workspace.renameFolder]', error);
    res.status(500).json({ message: 'Erreur lors du renommage.' });
  }
};

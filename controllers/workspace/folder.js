const fs = require('fs');
const paths = require('path');
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const ActivityLog = require('../../models/workspace/activityLog.model');
const storage = require('../../tools/storage');
const { WORKSPACE_BASE, safePath, isValidFolderName, escapeRegex } = require('./utils');

exports.createFolder = (req, res) => {
  const userId = res.locals.userId;
  const { path: subPath, folderName } = req.body;

  if (!subPath || !folderName || typeof subPath !== 'string' || typeof folderName !== 'string') {
    return res.status(400).json({ message: 'Paramètres invalides.' });
  }
  if (!isValidFolderName(folderName)) {
    return res.status(400).json({ message: 'Nom de dossier invalide.' });
  }

  const targetDir = safePath(WORKSPACE_BASE, userId, subPath);
  const newDir = targetDir && safePath(WORKSPACE_BASE, userId, subPath, folderName.trim());
  if (!targetDir || !newDir) {
    return res.status(400).json({ message: 'Chemin non autorisé.' });
  }

  try {
    fs.mkdirSync(newDir, { recursive: false });
    storage.ensureDir(paths.join('workspace', userId, subPath, folderName.trim())).catch(() => {});

    // Create WorkspaceFile record for the folder
    new WorkspaceFile({
      name: folderName.trim(),
      owner: userId,
      path: subPath,
      isDirectory: true,
    }).save().catch(() => {});

    // Activity log
    new ActivityLog({
      userId,
      action: 'create',
      targetName: folderName.trim(),
      details: { path: subPath, isDirectory: true },
    }).save().catch(() => {});

    // Emit socket event
    const io = require('../../socketStore').getInstance();
    if (io) {
      io.emit('workspace:folder-created', { folder: folderName.trim(), path: subPath, userId });
    }

    res.status(201).json({ message: 'Dossier créé', name: folderName.trim(), isDirectory: true });
  } catch (e) {
    if (e.code === 'EEXIST') return res.status(409).json({ message: 'Ce dossier existe déjà.' });
    res.status(500).json({ message: 'Une erreur est survenue lors de la création du dossier.' });
  }
};

exports.deleteFolder = (req, res) => {
  const userId = res.locals.userId;
  let parsed;
  try {
    parsed = JSON.parse(req.params.data);
  } catch {
    return res.status(400).json({ message: 'Paramètre invalide.' });
  }
  const { path: subPath, folderName } = parsed;

  if (!subPath || !folderName || typeof subPath !== 'string' || typeof folderName !== 'string') {
    return res.status(400).json({ message: 'Paramètres invalides.' });
  }

  const targetFolder = safePath(WORKSPACE_BASE, userId, subPath, folderName);
  if (!targetFolder) {
    return res.status(400).json({ message: 'Chemin non autorisé.' });
  }

  try {
    const stat = fs.statSync(targetFolder);
    if (!stat.isDirectory()) {
      return res.status(400).json({ message: 'Le chemin spécifié n\'est pas un dossier.' });
    }
  } catch {
    return res.status(404).json({ message: 'Dossier introuvable.' });
  }

  try {
    fs.rmSync(targetFolder, { recursive: true, force: false });
    storage.deleteDir(paths.join('workspace', userId, subPath, folderName)).catch(() => {});

    // Remove WorkspaceFile records for the folder and its children
    const folderPath = subPath + '/' + folderName;
    WorkspaceFile.deleteMany({
      owner: userId,
      $or: [
        { path: subPath, name: folderName, isDirectory: true },
        { path: { $regex: `^${escapeRegex(folderPath)}` } },
      ]
    }).catch(() => {});

    // Activity log
    new ActivityLog({
      userId,
      action: 'delete',
      targetName: folderName,
      details: { path: subPath, isDirectory: true },
    }).save().catch(() => {});

    // Emit socket event
    const io = require('../../socketStore').getInstance();
    if (io) {
      io.emit('workspace:folder-deleted', { folderName, path: subPath, userId });
    }

    res.status(200).json({ message: 'Dossier supprimé' });
  } catch {
    res.status(500).json({ message: 'Erreur lors de la suppression du dossier.' });
  }
};

exports.renameFolder = (req, res) => {
  const userId = res.locals.userId;
  const { path: subPath, oldName, newName } = req.body;

  if (!subPath || !oldName || !newName) {
    return res.status(400).json({ message: 'Paramètres invalides.' });
  }
  if (!isValidFolderName(newName)) {
    return res.status(400).json({ message: 'Nom de dossier invalide.' });
  }

  const oldPath = safePath(WORKSPACE_BASE, userId, subPath, oldName.trim());
  const newPath = safePath(WORKSPACE_BASE, userId, subPath, newName.trim());
  if (!oldPath || !newPath) {
    return res.status(400).json({ message: 'Chemin non autorisé.' });
  }

  try {
    fs.renameSync(oldPath, newPath);

    // Update WorkspaceFile record
    WorkspaceFile.findOneAndUpdate(
      { owner: userId, path: subPath, name: oldName.trim(), isDirectory: true },
      { name: newName.trim() }
    ).catch(() => {});

    // Activity log
    new ActivityLog({
      userId,
      action: 'rename',
      targetName: newName.trim(),
      details: { oldName: oldName.trim(), newName: newName.trim(), isDirectory: true },
    }).save().catch(() => {});

    res.status(200).json({ message: 'Dossier renommé', name: newName.trim() });
  } catch (e) {
    if (e.code === 'ENOENT') return res.status(404).json({ message: 'Dossier introuvable.' });
    if (e.code === 'EEXIST') return res.status(409).json({ message: 'Un dossier avec ce nom existe déjà.' });
    res.status(500).json({ message: 'Erreur lors du renommage.' });
  }
};

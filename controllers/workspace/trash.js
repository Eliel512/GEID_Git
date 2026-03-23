const fs = require('fs');
const paths = require('path');
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const ActivityLog = require('../../models/workspace/activityLog.model');
const storage = require('../../tools/storage');
const { WORKSPACE_BASE, safePath } = require('./utils');

exports.getTrash = async (req, res) => {
  const userId = res.locals.userId;
  try {
    const files = await WorkspaceFile.find({
      owner: userId,
      isTrashed: true,
    }).sort({ trashedAt: -1 });
    res.status(200).json(files);
  } catch {
    res.status(500).json({ message: 'Impossible de récupérer la corbeille.' });
  }
};

exports.moveToTrash = async (req, res) => {
  const userId = res.locals.userId;
  const { id } = req.params;
  try {
    const file = await WorkspaceFile.findOne({ _id: id, owner: userId });
    if (!file) return res.status(404).json({ message: 'Fichier introuvable.' });

    file.isTrashed = true;
    file.trashedAt = new Date();
    await file.save();

    new ActivityLog({
      userId,
      action: 'trash',
      targetId: file._id,
      targetName: file.name,
    }).save().catch(() => {});

    res.status(200).json({ message: 'Fichier déplacé dans la corbeille.' });
  } catch {
    res.status(500).json({ message: 'Impossible de déplacer le fichier dans la corbeille.' });
  }
};

exports.restoreFromTrash = async (req, res) => {
  const userId = res.locals.userId;
  const { id } = req.params;
  try {
    const file = await WorkspaceFile.findOne({ _id: id, owner: userId, isTrashed: true });
    if (!file) return res.status(404).json({ message: 'Fichier introuvable dans la corbeille.' });

    file.isTrashed = false;
    file.trashedAt = undefined;
    await file.save();

    new ActivityLog({
      userId,
      action: 'restore',
      targetId: file._id,
      targetName: file.name,
    }).save().catch(() => {});

    res.status(200).json({ message: 'Fichier restauré.' });
  } catch {
    res.status(500).json({ message: 'Impossible de restaurer le fichier.' });
  }
};

exports.permanentDelete = async (req, res) => {
  const userId = res.locals.userId;
  const { id } = req.params;
  try {
    const file = await WorkspaceFile.findOne({ _id: id, owner: userId, isTrashed: true });
    if (!file) return res.status(404).json({ message: 'Fichier introuvable.' });

    // Delete from filesystem + MinIO
    if (file.contentUrl) {
      const absPath = paths.resolve(file.contentUrl);
      try { fs.unlinkSync(absPath); } catch { /* already deleted */ }
      storage.deleteFile(file.contentUrl).catch(() => {});
    }

    await WorkspaceFile.deleteOne({ _id: id });

    new ActivityLog({
      userId,
      action: 'delete',
      targetName: file.name,
      details: { permanent: true },
    }).save().catch(() => {});

    res.status(200).json({ message: 'Fichier supprimé définitivement.' });
  } catch {
    res.status(500).json({ message: 'Impossible de supprimer le fichier.' });
  }
};

exports.emptyTrash = async (req, res) => {
  const userId = res.locals.userId;
  try {
    const trashedFiles = await WorkspaceFile.find({ owner: userId, isTrashed: true });

    for (const file of trashedFiles) {
      if (file.contentUrl) {
        try { fs.unlinkSync(paths.resolve(file.contentUrl)); } catch { /* ok */ }
        storage.deleteFile(file.contentUrl).catch(() => {});
      }
    }

    await WorkspaceFile.deleteMany({ owner: userId, isTrashed: true });

    new ActivityLog({
      userId,
      action: 'delete',
      targetName: 'corbeille',
      details: { permanent: true, count: trashedFiles.length },
    }).save().catch(() => {});

    res.status(200).json({ message: 'Corbeille vidée.', count: trashedFiles.length });
  } catch {
    res.status(500).json({ message: 'Impossible de vider la corbeille.' });
  }
};

const crypto = require('crypto');
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const ActivityLog = require('../../models/workspace/activityLog.model');

exports.shareWithUser = async (req, res) => {
  const userId = res.locals.userId;
  const { fileId, targetUserId, permission } = req.body;

  if (!fileId || !targetUserId) {
    return res.status(400).json({ message: 'Paramètres invalides.' });
  }

  try {
    const file = await WorkspaceFile.findOne({ _id: fileId, owner: userId });
    if (!file) return res.status(404).json({ message: 'Fichier introuvable.' });

    const existing = file.sharedWith.find(s => s.userId === targetUserId);
    if (existing) {
      existing.permission = permission || 'view';
    } else {
      file.sharedWith.push({ userId: targetUserId, permission: permission || 'view' });
    }
    await file.save();

    new ActivityLog({
      userId,
      action: 'share',
      targetId: file._id,
      targetName: file.name,
      details: { targetUserId, permission: permission || 'view' },
    }).save().catch(() => {});

    res.status(200).json({ message: 'Fichier partagé.', sharedWith: file.sharedWith });
  } catch {
    res.status(500).json({ message: 'Impossible de partager le fichier.' });
  }
};

exports.createShareLink = async (req, res) => {
  const userId = res.locals.userId;
  const { fileId } = req.body;

  if (!fileId) {
    return res.status(400).json({ message: 'Paramètre invalide.' });
  }

  try {
    const file = await WorkspaceFile.findOne({ _id: fileId, owner: userId });
    if (!file) return res.status(404).json({ message: 'Fichier introuvable.' });

    if (!file.shareLink) {
      file.shareLink = crypto.randomBytes(16).toString('hex');
      await file.save();
    }

    new ActivityLog({
      userId,
      action: 'share',
      targetId: file._id,
      targetName: file.name,
      details: { type: 'link' },
    }).save().catch(() => {});

    res.status(200).json({ shareLink: file.shareLink });
  } catch {
    res.status(500).json({ message: 'Impossible de créer le lien de partage.' });
  }
};

exports.revokeShare = async (req, res) => {
  const userId = res.locals.userId;
  const { id } = req.params;
  const { targetUserId } = req.body;

  try {
    const file = await WorkspaceFile.findOne({ _id: id, owner: userId });
    if (!file) return res.status(404).json({ message: 'Fichier introuvable.' });

    if (targetUserId) {
      file.sharedWith = file.sharedWith.filter(s => s.userId !== targetUserId);
    } else {
      file.shareLink = undefined;
    }
    await file.save();

    res.status(200).json({ message: 'Partage révoqué.' });
  } catch {
    res.status(500).json({ message: 'Impossible de révoquer le partage.' });
  }
};

exports.getSharedWithMe = async (req, res) => {
  const userId = res.locals.userId;
  try {
    const files = await WorkspaceFile.find({
      'sharedWith.userId': userId,
      isTrashed: false,
    }).sort({ updatedAt: -1 });
    res.status(200).json(files);
  } catch {
    res.status(500).json({ message: 'Impossible de récupérer les fichiers partagés.' });
  }
};

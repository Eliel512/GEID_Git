const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const ActivityLog = require('../../models/workspace/activityLog.model');

exports.getFavorites = async (req, res) => {
  const userId = res.locals.userId;
  try {
    const files = await WorkspaceFile.find({
      owner: userId,
      isFavorite: true,
      isTrashed: false,
    }).sort({ updatedAt: -1 });
    res.status(200).json(files);
  } catch {
    res.status(500).json({ message: 'Impossible de récupérer les favoris.' });
  }
};

exports.toggleFavorite = async (req, res) => {
  const userId = res.locals.userId;
  const { id } = req.params;
  try {
    const file = await WorkspaceFile.findOne({ _id: id, owner: userId });
    if (!file) return res.status(404).json({ message: 'Fichier introuvable.' });

    file.isFavorite = !file.isFavorite;
    await file.save();

    new ActivityLog({
      userId,
      action: 'favorite',
      targetId: file._id,
      targetName: file.name,
      details: { isFavorite: file.isFavorite },
    }).save().catch(() => {});

    res.status(200).json({ isFavorite: file.isFavorite });
  } catch {
    res.status(500).json({ message: 'Impossible de modifier le favori.' });
  }
};

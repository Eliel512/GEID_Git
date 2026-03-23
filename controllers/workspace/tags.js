const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const ActivityLog = require('../../models/workspace/activityLog.model');

exports.updateTags = async (req, res) => {
  const userId = res.locals.userId;
  const { id } = req.params;
  const { tags } = req.body;

  if (!Array.isArray(tags)) {
    return res.status(400).json({ message: 'Les tags doivent être un tableau.' });
  }

  try {
    const file = await WorkspaceFile.findOneAndUpdate(
      { _id: id, owner: userId },
      { tags: tags.map(t => String(t).trim()).filter(Boolean) },
      { new: true }
    );
    if (!file) return res.status(404).json({ message: 'Fichier introuvable.' });

    new ActivityLog({
      userId,
      action: 'tag',
      targetId: file._id,
      targetName: file.name,
      details: { tags: file.tags },
    }).save().catch(() => {});

    res.status(200).json({ tags: file.tags });
  } catch {
    res.status(500).json({ message: 'Impossible de mettre à jour les tags.' });
  }
};

exports.getAllTags = async (req, res) => {
  const userId = res.locals.userId;
  try {
    const tags = await WorkspaceFile.distinct('tags', { owner: userId, isTrashed: false });
    res.status(200).json(tags.filter(Boolean));
  } catch {
    res.status(500).json({ message: 'Impossible de récupérer les tags.' });
  }
};

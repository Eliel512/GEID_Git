const WorkspaceFile = require('../../models/workspace/workspaceFile.model');

/**
 * PATCH /api/stuff/workspace/color/:id
 * Body: { color: "#hex" | null }
 */
exports.setFolderColor = async (req, res) => {
  const userId = res.locals.userId;
  const { id } = req.params;
  const { color } = req.body;

  try {
    const file = await WorkspaceFile.findOne({ _id: id, owner: userId, isDirectory: true });
    if (!file) return res.status(404).json({ message: 'Dossier introuvable.' });

    file.color = color || null;
    await file.save();

    res.status(200).json({ message: 'Couleur mise à jour.', color: file.color });
  } catch {
    res.status(500).json({ message: 'Impossible de modifier la couleur.' });
  }
};

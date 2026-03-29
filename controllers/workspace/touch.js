const WorkspaceFile = require('../../models/workspace/workspaceFile.model');

/**
 * PATCH /api/stuff/workspace/touch/:id
 * Marque un fichier comme consulté (met à jour lastAccessedAt).
 */
exports.touchFile = async (req, res) => {
  const userId = res.locals.userId;
  const { id } = req.params;

  try {
    const file = await WorkspaceFile.findOneAndUpdate(
      { _id: id, owner: userId },
      { lastAccessedAt: new Date() },
      { new: true }
    );
    if (!file) return res.status(404).json({ message: 'Fichier introuvable.' });
    res.status(200).json({ lastAccessedAt: file.lastAccessedAt });
  } catch {
    res.status(500).json({ message: 'Erreur.' });
  }
};

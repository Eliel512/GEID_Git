const WorkspaceFile = require('../../models/workspace/workspaceFile.model');

exports.getRecent = async (req, res) => {
  const userId = res.locals.userId;
  const limit = Math.min(Number(req.query.limit) || 50, 200);

  try {
    const files = await WorkspaceFile.find({
      owner: userId,
      isTrashed: false,
      isDirectory: false,
      lastAccessedAt: { $exists: true, $ne: null },
    })
      .sort({ lastAccessedAt: -1 })
      .limit(limit);

    res.status(200).json(files);
  } catch {
    res.status(500).json({ message: 'Impossible de récupérer les fichiers récents.' });
  }
};

const WorkspaceFile = require('../../models/workspace/workspaceFile.model');

// Default quota: 5 GB
const DEFAULT_QUOTA = 5 * 1024 * 1024 * 1024;

exports.getQuota = async (req, res) => {
  const userId = res.locals.userId;
  try {
    const result = await WorkspaceFile.aggregate([
      { $match: { owner: userId, isDirectory: false, isTrashed: { $ne: true } } },
      { $group: { _id: null, totalSize: { $sum: '$size' } } },
    ]);

    const used = result.length > 0 ? result[0].totalSize : 0;
    res.status(200).json({ used, total: DEFAULT_QUOTA });
  } catch {
    res.status(500).json({ message: 'Impossible de calculer le quota.' });
  }
};

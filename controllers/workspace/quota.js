const WorkspaceFile = require('../../models/workspace/workspaceFile.model');

// Default quota: 5 GB
const DEFAULT_QUOTA = 5 * 1024 * 1024 * 1024;

exports.getQuota = async (req, res) => {
  const userId = res.locals.userId;
  try {
    const result = await WorkspaceFile.aggregate([
      { $match: { owner: userId, isDirectory: false } },
      { $group: { _id: null, totalSize: { $sum: '$size' } } },
    ]);

    const used = result.length > 0 ? result[0].totalSize : 0;
    const total = DEFAULT_QUOTA;

    res.status(200).json({ used, total });
  } catch {
    res.status(500).json({ message: 'Impossible de calculer le quota.' });
  }
};

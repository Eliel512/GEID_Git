const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const getHost = require('../getHost').getHost();

exports.getRecent = async (req, res) => {
  const userId = res.locals.userId;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const tag = req.query.tag || null;

  try {
    const query = {
      owner: userId,
      isTrashed: { $ne: true },
      isDirectory: false,
      lastAccessedAt: { $exists: true, $ne: null },
    };
    if (tag) query.tags = tag;

    const files = await WorkspaceFile.find(query)
      .sort({ lastAccessedAt: -1 })
      .limit(limit)
      .lean();

    // Construire la réponse avec les URLs
    const result = files.map((f) => {
      const urlPath = [userId, f.path, f.name].filter(Boolean).join('/');
      return {
        name: f.name,
        url: `https://${getHost}/api/stuff/workspace/file/${urlPath}`,
        contentUrl: f.contentUrl || '',
        createdAt: f.updatedAt || f.createdAt,
        lastAccessedAt: f.lastAccessedAt,
        size: f.size || 0,
        format: f.format || '',
        mimeType: f.mimeType || '',
        isDirectory: false,
        currentPath: f.path || '',
        tags: f.tags || [],
        _id: f._id,
      };
    });

    res.status(200).json(result);
  } catch {
    res.status(500).json({ message: 'Impossible de récupérer les fichiers récents.' });
  }
};

/**
 * GET /api/stuff/workspace/recent/tags
 * Retourne les tags les plus utilisés par l'utilisateur (top 20).
 */
exports.getRecentTags = async (req, res) => {
  const userId = res.locals.userId;
  try {
    const result = await WorkspaceFile.aggregate([
      { $match: { owner: userId, isTrashed: { $ne: true }, tags: { $exists: true, $ne: [] } } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);
    res.status(200).json(result.map((r) => ({ tag: r._id, count: r.count })));
  } catch {
    res.status(500).json({ message: 'Impossible de récupérer les mots-clés.' });
  }
};

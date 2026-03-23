const WorkspaceFile = require('../../models/workspace/workspaceFile.model');

exports.search = async (req, res) => {
  const userId = res.locals.userId;
  const { q, type, dateFrom, dateTo, minSize, maxSize, tags } = req.query;

  if (!q && !type && !tags) {
    return res.status(400).json({ message: 'Veuillez fournir un critère de recherche.' });
  }

  try {
    const query = { owner: userId, isTrashed: false };

    // Full-text search
    if (q) {
      query.$text = { $search: q };
    }

    // Filter by file format/type
    if (type) {
      query.format = { $in: type.split(',').map(t => t.trim()) };
    }

    // Date range
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Size range
    if (minSize || maxSize) {
      query.size = {};
      if (minSize) query.size.$gte = Number(minSize);
      if (maxSize) query.size.$lte = Number(maxSize);
    }

    // Tags filter
    if (tags) {
      query.tags = { $in: tags.split(',').map(t => t.trim()) };
    }

    const projection = q ? { score: { $meta: 'textScore' } } : {};
    const sort = q ? { score: { $meta: 'textScore' } } : { updatedAt: -1 };

    const results = await WorkspaceFile.find(query, projection)
      .sort(sort)
      .limit(100);

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la recherche.' });
  }
};

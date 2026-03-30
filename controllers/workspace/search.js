const WorkspaceFile = require('../../models/workspace/workspaceFile.model');

exports.search = async (req, res) => {
  const userId = res.locals.userId;
  const { q, type, dateFrom, dateTo, minSize, maxSize, tags } = req.query;

  if (!q && !type && !tags) {
    return res.status(400).json({ message: 'Veuillez fournir un critère de recherche.' });
  }

  try {
    // Search both active and trashed items
    const query = { owner: userId };

    const projection = {
      _id: 1, name: 1, path: 1, isDirectory: 1, isTrashed: 1,
      size: 1, format: 1, contentUrl: 1, color: 1, isFavorite: 1,
      createdAt: 1, updatedAt: 1, lastAccessedAt: 1,
    };

    // Fuzzy/partial matching via regex (accent-insensitive, case-insensitive)
    if (q) {
      const sanitized = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Build a regex that matches partial words
      query.name = { $regex: sanitized, $options: 'i' };
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

    const results = await WorkspaceFile.find(query, projection)
      .sort({ isTrashed: 1, updatedAt: -1 })
      .limit(50);

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la recherche.' });
  }
};

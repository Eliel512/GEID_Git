const ActivityLog = require('../../models/workspace/activityLog.model');

exports.getActivity = async (req, res) => {
  const userId = res.locals.userId;
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const before = req.query.before;

  try {
    const query = { userId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const logs = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json(logs);
  } catch {
    res.status(500).json({ message: 'Impossible de récupérer le journal d\'activité.' });
  }
};

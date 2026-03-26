const getHost = require('../getHost').getHost();
const { listFromDB } = require('./utils');

exports.getAll = async (req, res) => {
  const userId = res.locals.userId;
  let parsed;
  try {
    parsed = JSON.parse(req.params.data);
  } catch {
    return res.status(400).json({ message: 'Paramètre invalide.' });
  }
  const subPath = parsed['path'];
  if (typeof subPath !== 'string') {
    return res.status(400).json({ message: 'Paramètre invalide.' });
  }

  try {
    const result = await listFromDB(userId, subPath, getHost);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(result);
  } catch (error) {
    console.error('[workspace.getAll]', error);
    res.status(500).json({ message: 'Une erreur est survenue lors de la lecture du dossier.' });
  }
};

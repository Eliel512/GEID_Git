const User = require('../../models/users/user.model');

/**
 * GET /api/stuff/workspace/users/list
 * Liste les utilisateurs GEID (pour le partage). Exclut l'utilisateur courant.
 */
exports.listUsers = async (req, res) => {
  const userId = res.locals.userId;
  try {
    const users = await User.find(
      { _id: { $ne: userId }, isValid: { $ne: false } },
      'fname lname email imageUrl'
    ).lean();
    res.status(200).json(users);
  } catch {
    res.status(500).json({ message: 'Impossible de charger la liste des utilisateurs.' });
  }
};

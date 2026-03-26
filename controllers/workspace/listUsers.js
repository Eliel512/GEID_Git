const User = require('../../models/users/user.model');

/**
 * GET /api/stuff/workspace/users/list
 * Retourne les contacts de l'utilisateur connecté (pas tous les users).
 * Si l'utilisateur n'a pas de contacts, retourne une liste vide.
 */
exports.listUsers = async (req, res) => {
  const userId = res.locals.userId;
  try {
    const currentUser = await User.findById(userId, 'contacts').lean();
    if (!currentUser?.contacts?.length) {
      return res.status(200).json([]);
    }

    const contacts = await User.find(
      { _id: { $in: currentUser.contacts } },
      'fname lname email imageUrl'
    ).lean();

    res.status(200).json(contacts);
  } catch {
    res.status(500).json({ message: 'Impossible de charger vos contacts.' });
  }
};

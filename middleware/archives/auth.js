const User = require('../../models/users/user.model');
const Auth = require('../../models/users/auth.model');

/**
 * Vérifie que l'utilisateur connecté possède un accès en écriture
 * sur l'application "archives" dans son profil d'autorisation.
 */
module.exports = (req, res, next) => {
    User.findOne({ _id: res.locals.userId }, { auth: 1 })
        .then(user => {
            if (!user) {
                return res.status(401).json({ message: 'Accès non autorisé' });
            }
            Auth.findOne({ _id: user.auth })
                .then(auth => {
                    if (!auth) {
                        return res.status(401).json({ message: 'Accès non autorisé' });
                    }
                    const hasAccess = auth.privileges.some(
                        priv => priv.app === 'archives' &&
                        priv.permissions.some(perm => perm.access === 'write')
                    );
                    if (!hasAccess) {
                        return res.status(401).json({ message: 'Opération non autorisée' });
                    }
                    next();
                })
                .catch(error => {
                    console.log(error);
                    return res.status(500).json({ message: 'Une erreur est survenue' });
                });
        })
        .catch(error => {
            console.log(error);
            return res.status(500).json({ message: 'Une erreur est survenue' });
        });
};
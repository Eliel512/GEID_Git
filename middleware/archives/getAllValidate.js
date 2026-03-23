'use strict';

/**
 * middleware/archives/getAllValidate.js
 *
 * Détermine les unités administratives visibles pour l'utilisateur connecté.
 * Prend en compte la HIÉRARCHIE du cadre organique :
 * si l'utilisateur a accès à "DANTIC", il voit aussi les archives
 * de toutes les sous-unités (Division Archives, Bureau Archives, etc.).
 *
 * Injecte res.locals.structs = tableau de noms d'unités autorisées.
 */

const User = require('../../models/users/user.model');
const Auth = require('../../models/users/auth.model');
const Role = require('../../models/users/role.model');

/**
 * Récupère récursivement tous les rôles subordonnés.
 */
async function getSubordinateRoles(roleName) {
    if (roleName === 'all') return ['all'];
    const result = [roleName];
    const queue = [roleName];
    while (queue.length > 0) {
        const current = queue.shift();
        const role = await Role.findOne({ name: current });
        if (role?.children?.length) {
            for (const child of role.children) {
                if (!result.includes(child)) {
                    result.push(child);
                    queue.push(child);
                }
            }
        }
    }
    return result;
}

module.exports = async (req, res, next) => {
    try {
        const user = await User.findOne({ _id: res.locals.userId }, { auth: 1 });
        if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

        const auth = await Auth.findOne({ _id: user.auth });
        if (!auth) return res.status(401).json({ message: 'Profil d\'autorisation introuvable.' });

        if (!auth.privileges.some(priv => priv.app === 'archives')) {
            return res.status(401).json({ message: 'Vous n\'avez pas accès au module archives.' });
        }

        // Collecter les structs directes des permissions
        const directStructs = [];
        auth.privileges.forEach(priv => {
            if (priv.app === 'archives') {
                priv.permissions.forEach(perm => directStructs.push(perm.struct));
            }
        });

        // Admin → accès total
        if (directStructs.includes('all')) {
            res.locals.structs = ['all'];
            return next();
        }

        // Pour chaque struct, inclure tous les rôles subordonnés
        const allStructs = new Set();
        for (const struct of directStructs) {
            const subordinates = await getSubordinateRoles(struct);
            subordinates.forEach(s => allStructs.add(s));
        }

        res.locals.structs = [...allStructs];
        next();
    } catch (error) {
        console.error('[getAllValidate middleware]', error);
        res.status(500).json({ message: 'Une erreur est survenue.' });
    }
};

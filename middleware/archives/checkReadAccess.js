'use strict';

/**
 * middleware/archives/checkReadAccess.js
 *
 * Vérifie que l'utilisateur authentifié a un accès en LECTURE (read ou write)
 * sur l'unité administrative de l'archive ciblée.
 *
 * Prend en compte la hiérarchie du cadre organique :
 * si l'utilisateur a accès à "DANTIC", il peut lire les archives
 * de toutes les sous-unités.
 */

const User    = require('../../models/users/user.model');
const Auth    = require('../../models/users/auth.model');
const Archive = require('../../models/archives/archive.model');
const Role    = require('../../models/users/role.model');

/**
 * Vérifie si `targetUnit` est un descendant de `parentUnit` dans le cadre organique.
 */
async function isSubordinate(targetUnit, parentUnit) {
    if (targetUnit === parentUnit) return true;
    let current = targetUnit;
    const visited = new Set();
    while (current) {
        if (visited.has(current)) break;
        visited.add(current);
        const role = await Role.findOne({ name: current });
        if (!role?.parent) break;
        if (role.parent === parentUnit) return true;
        current = role.parent;
    }
    return false;
}

module.exports = async (req, res, next) => {
    try {
        if (!req.params.id?.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(404).json({ message: 'Archive introuvable.' });
        }
        const archive = await Archive.findById(req.params.id, { administrativeUnit: 1 });
        if (!archive) return res.status(404).json({ message: 'Archive introuvable.' });

        const user = await User.findById(res.locals.userId, { auth: 1 });
        if (!user) return res.status(401).json({ message: 'Utilisateur introuvable.' });

        const auth = await Auth.findById(user.auth);
        if (!auth) return res.status(401).json({ message: 'Droits introuvables.' });

        const archiveUnit = archive.administrativeUnit;
        let hasAccess = false;

        for (const priv of auth.privileges) {
            if (priv.app !== 'archives') continue;
            for (const perm of priv.permissions) {
                // Accès read OU write autorise la lecture
                if (perm.access !== 'read' && perm.access !== 'write') continue;
                if (perm.struct === 'all') { hasAccess = true; break; }
                if (await isSubordinate(archiveUnit, perm.struct)) { hasAccess = true; break; }
            }
            if (hasAccess) break;
        }

        if (!hasAccess) {
            return res.status(403).json({ message: 'Vous n\'avez pas accès à ce fichier.' });
        }

        next();
    } catch (error) {
        console.error('[checkReadAccess]', error);
        res.status(500).json({ message: 'Une erreur est survenue.' });
    }
};

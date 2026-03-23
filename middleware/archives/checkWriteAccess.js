'use strict';

/**
 * middleware/archives/checkWriteAccess.js
 *
 * Vérifie que l'utilisateur authentifié a un accès en ÉCRITURE sur
 * l'unité administrative de l'archive ciblée.
 *
 * Prend en compte la hiérarchie du cadre organique :
 * si l'utilisateur a write sur "DANTIC", il peut modifier les archives
 * de toutes les sous-unités (Division Archives, Bureau Archives, etc.).
 */

const User    = require('../../models/users/user.model');
const Auth    = require('../../models/users/auth.model');
const Archive = require('../../models/archives/archive.model');
const Role    = require('../../models/users/role.model');

/**
 * Vérifie si `targetUnit` est un descendant de `parentUnit` dans le cadre organique.
 * Remonte la chaîne parent jusqu'à trouver parentUnit ou atteindre la racine.
 */
async function isSubordinate(targetUnit, parentUnit) {
    if (targetUnit === parentUnit) return true;
    let current = targetUnit;
    const visited = new Set();
    while (current) {
        if (visited.has(current)) break; // protection boucle infinie
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
        const archive = await Archive.findById(req.params.id, { administrativeUnit: 1 });
        if (!archive) return res.status(404).json({ error: 'Archive introuvable.' });

        const user = await User.findById(res.locals.userId, { auth: 1 });
        if (!user) return res.status(401).json({ error: 'Utilisateur introuvable.' });

        const auth = await Auth.findById(user.auth);
        if (!auth) return res.status(401).json({ error: 'Droits introuvables.' });

        // Vérifier les permissions write en tenant compte de la hiérarchie
        const archiveUnit = archive.administrativeUnit;
        let hasWrite = false;

        for (const priv of auth.privileges) {
            if (priv.app !== 'archives') continue;
            for (const perm of priv.permissions) {
                if (perm.access !== 'write') continue;
                if (perm.struct === 'all') { hasWrite = true; break; }
                // Vérifier si l'unité de l'archive est subordonnée à la struct du user
                if (await isSubordinate(archiveUnit, perm.struct)) { hasWrite = true; break; }
            }
            if (hasWrite) break;
        }

        if (!hasWrite) {
            return res.status(403).json({ error: 'Vous n\'avez pas les droits nécessaires pour cette opération.' });
        }

        res.locals.archive = archive;
        next();
    } catch (error) {
        console.error('[checkWriteAccess]', error);
        res.status(500).json({ error: 'Une erreur est survenue.' });
    }
};

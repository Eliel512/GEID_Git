/**
 * controllers/archives/permissions.js
 *
 * GET /api/stuff/me/permissions
 *
 * Retourne les permissions archives de l'utilisateur authentifié :
 * {
 *   isAdmin: boolean,         // true si struct 'all' en écriture
 *   canRead: boolean,         // au moins une permission de lecture
 *   canWrite: boolean,        // au moins une permission d'écriture
 *   structs: [                // liste des unités autorisées
 *     { struct: string, access: 'read'|'write' }
 *   ]
 * }
 */

const User = require('../../models/users/user.model');
const Auth = require('../../models/users/auth.model');

module.exports = async (req, res) => {
    try {
        const user = await User.findById(res.locals.userId, { auth: 1 });
        if (!user) return res.status(401).json({ error: 'Utilisateur introuvable' });

        const auth = await Auth.findById(user.auth);
        if (!auth) return res.status(401).json({ error: 'Droits introuvables' });

        const archPriv = auth.privileges.find(p => p.app === 'archives');
        if (!archPriv) {
            return res.status(200).json({
                isAdmin: false,
                canRead: false,
                canWrite: false,
                structs: []
            });
        }

        const perms = archPriv.permissions || [];
        const isAdmin  = perms.some(p => p.struct === 'all' && p.access === 'write');
        const canWrite = perms.some(p => p.access === 'write');
        const canRead  = perms.length > 0;

        res.status(200).json({
            isAdmin,
            canRead,
            canWrite,
            structs: perms.map(p => ({ struct: p.struct, access: p.access }))
        });
    } catch (error) {
        console.error('[permissions]', error);
        res.status(500).json({ error: 'Une erreur est survenue' });
    }
};

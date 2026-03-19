/**
 * middleware/archives/checkWriteAccess.js
 *
 * Vérifie que l'utilisateur authentifié a un accès en ÉCRITURE sur
 * l'unité administrative de l'archive ciblée par req.params.id.
 *
 * → 403 si l'accès est refusé
 * → 404 si l'archive est introuvable
 * → next() si autorisé
 */
const User = require('../../models/users/user.model');
const Auth = require('../../models/users/auth.model');
const Archive = require('../../models/archives/archive.model');

module.exports = async (req, res, next) => {
    try {
        const archive = await Archive.findById(req.params.id, { administrativeUnit: 1 });
        if (!archive) return res.status(404).json({ error: 'Archive introuvable' });

        const user = await User.findById(res.locals.userId, { auth: 1 });
        if (!user) return res.status(401).json({ error: 'Utilisateur introuvable' });

        const auth = await Auth.findById(user.auth);
        if (!auth) return res.status(401).json({ error: 'Droits introuvables' });

        const hasWrite = auth.privileges.some(priv =>
            priv.app === 'archives' &&
            priv.permissions.some(p =>
                (p.struct === archive.administrativeUnit || p.struct === 'all') &&
                p.access === 'write'
            )
        );

        if (!hasWrite) {
            return res.status(403).json({ error: 'Accès en écriture requis pour cette opération.' });
        }

        res.locals.archive = archive;
        next();
    } catch (error) {
        console.error('[checkWriteAccess]', error);
        res.status(500).json({ error: 'Une erreur est survenue' });
    }
};

/**
 * controllers/archives/lifecycle.js
 *
 * PATCH /api/stuff/archives/:id/lifecycle
 *
 * Gère les transitions du cycle de vie d'une archive :
 *   pending    → validated  (via validate route, non géré ici)
 *   validated  → archived   (clôture définitive)
 *   validated  → pending    (réouverture pour correction)
 *   archived   → disposed   (élimination selon plan de conservation)
 *
 * Transitions autorisées selon le statut actuel :
 *   pending   : → validated (archiviste)
 *   validated : → archived  (archiviste avec accès écriture)
 *   validated : → pending   (archiviste avec accès écriture — réouverture)
 *   archived  : → disposed  (admin seulement — struct 'all')
 *
 * Body attendu : { targetStatus: string, note?: string }
 */

const Archive = require('../../models/archives/archive.model');
const User    = require('../../models/users/user.model');
const Auth    = require('../../models/users/auth.model');

const ALLOWED_TRANSITIONS = {
    pending:   ['validated'],
    validated: ['archived', 'pending'],
    archived:  ['disposed'],
    disposed:  []
};

// Transitions nécessitant les droits admin (struct 'all' en écriture)
const ADMIN_ONLY_TRANSITIONS = new Set(['disposed']);

module.exports = async (req, res) => {
    const { targetStatus, note = '' } = req.body;

    if (!targetStatus) {
        return res.status(400).json({ error: 'Le champ targetStatus est requis.' });
    }

    try {
        const archive = await Archive.findById(req.params.id);
        if (!archive) return res.status(404).json({ error: 'Archive introuvable' });

        const currentStatus = archive.status || (archive.validated ? 'validated' : 'pending');

        // Vérifier si la transition est autorisée
        const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
        if (!allowed.includes(targetStatus)) {
            return res.status(422).json({
                error: `Transition non autorisée : ${currentStatus} → ${targetStatus}.`,
                allowedTransitions: allowed
            });
        }

        // Vérifier les droits de l'utilisateur
        const user = await User.findById(res.locals.userId, { auth: 1 });
        const auth = await Auth.findById(user.auth);

        const archPriv = auth.privileges.find(p => p.app === 'archives');
        if (!archPriv) return res.status(403).json({ error: 'Aucun privilège archives.' });

        const perms = archPriv.permissions;
        const isAdmin = perms.some(p => p.struct === 'all' && p.access === 'write');
        const hasWriteOnUnit = perms.some(
            p => (p.struct === archive.administrativeUnit || p.struct === 'all') && p.access === 'write'
        );

        if (ADMIN_ONLY_TRANSITIONS.has(targetStatus) && !isAdmin) {
            return res.status(403).json({ error: 'Seul un administrateur peut effectuer cette transition.' });
        }

        if (!hasWriteOnUnit) {
            return res.status(403).json({ error: 'Accès en écriture requis sur cette unité administrative.' });
        }

        // Appliquer la transition
        const historyEntry = {
            status: targetStatus,
            changedAt: new Date(),
            changedBy: res.locals.userId,
            note
        };

        const updatedArchive = await Archive.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    status: targetStatus,
                    validated: targetStatus === 'validated' || targetStatus === 'archived'
                },
                $push: { lifecycleHistory: historyEntry }
            },
            { new: true }
        );

        res.status(200).json(updatedArchive);
    } catch (error) {
        console.error('[lifecycle]', error);
        res.status(500).json({ error: 'Une erreur est survenue' });
    }
};

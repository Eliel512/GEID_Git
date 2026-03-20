/**
 * controllers/archives/lifecycle.js
 *
 * PATCH /api/stuff/archives/:id/lifecycle
 *
 * Gère les transitions du cycle de vie d'une archive selon les
 * Directives relatives à l'archivage (Ministère du Budget, RDC) :
 *
 *   pending       → actif          (validation par archiviste)
 *   actif         → intermédiaire  (passage en archives intermédiaires)
 *   actif         → pending        (réouverture pour correction)
 *   intermédiaire → actif          (réactivation)
 *   intermédiaire → historique     (conservation définitive — DUA écoulé ou décision)
 *   intermédiaire → détruit        (élimination — admin uniquement)
 *   historique    → détruit        (destruction — admin uniquement)
 *   détruit       → historique     (restauration — admin uniquement)
 *
 * Compatibilité : anciens statuts (validated, archived, disposed) sont aussi gérés.
 *
 * Body attendu : { targetStatus: string, note?: string }
 */

const Archive = require('../../models/archives/archive.model');
const User    = require('../../models/users/user.model');
const Auth    = require('../../models/users/auth.model');

const ALLOWED_TRANSITIONS = {
    // Nouveau cycle de vie
    pending:          ['actif'],
    actif:            ['intermédiaire', 'pending'],
    'intermédiaire':  ['actif', 'historique', 'détruit'],
    historique:       ['détruit'],
    détruit:          ['historique'],
    // Anciens statuts — compatibilité ascendante
    validated: ['actif', 'intermédiaire', 'pending'],
    archived:  ['actif', 'intermédiaire', 'historique', 'détruit'],
    disposed:  ['historique'],
};

// Transitions réservées aux administrateurs (struct 'all' en écriture)
const ADMIN_ONLY_TRANSITIONS = new Set(['détruit', 'disposed']);

// Statuts considérés comme "actif/validé" (boolean validated = true)
const VALIDATED_STATUSES = new Set(['actif', 'intermédiaire', 'historique', 'détruit', 'validated', 'archived']);

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

        // Démarrer la DUA si on passe en intermédiaire
        const setFields = {
            status: targetStatus,
            validated: VALIDATED_STATUSES.has(targetStatus)
        };
        if (targetStatus === 'intermédiaire' && !archive.dua?.startDate) {
            setFields['dua.startDate'] = new Date();
        }

        const updatedArchive = await Archive.findByIdAndUpdate(
            req.params.id,
            {
                $set: setFields,
                $push: { lifecycleHistory: historyEntry }
            },
            { new: true, runValidators: false }
        );

        res.status(200).json(updatedArchive);
    } catch (error) {
        console.error('[lifecycle]', error);
        res.status(500).json({ error: 'Une erreur est survenue' });
    }
};

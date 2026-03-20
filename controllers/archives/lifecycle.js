/**
 * controllers/archives/lifecycle.js
 *
 * PATCH /api/stuff/archives/:id/lifecycle
 *
 * Lifecycle transitions (Directives archivage RDC — ISO 15489) :
 *
 *   PENDING    → ACTIVE       (validation by archivist)
 *   ACTIVE     → SEMI_ACTIVE  (transfer to intermediate archives)
 *   ACTIVE     → PENDING      (reopen for correction)
 *   SEMI_ACTIVE → ACTIVE      (reactivation)
 *   SEMI_ACTIVE → PERMANENT   (final conservation — DUA expired or decision)
 *   SEMI_ACTIVE → DESTROYED   (elimination — admin only)
 *   PERMANENT  → DESTROYED    (destruction — admin only)
 *   DESTROYED  → PERMANENT    (restoration — admin only)
 *
 * Legacy status values (validated, archived, disposed, actif, etc.)
 * are handled for backward compatibility.
 *
 * Body: { targetStatus: string, note?: string }
 */

const Archive = require('../../models/archives/archive.model');
const User    = require('../../models/users/user.model');
const Auth    = require('../../models/users/auth.model');

const ALLOWED_TRANSITIONS = {
    // New lifecycle
    PENDING:     ['ACTIVE'],
    ACTIVE:      ['SEMI_ACTIVE', 'PENDING'],
    SEMI_ACTIVE: ['ACTIVE', 'PERMANENT', 'DESTROYED'],
    PERMANENT:   ['DESTROYED'],
    DESTROYED:   ['PERMANENT'],
    // Legacy backward compat
    pending:        ['ACTIVE', 'PENDING'],
    validated:      ['ACTIVE', 'SEMI_ACTIVE', 'PENDING'],
    archived:       ['ACTIVE', 'SEMI_ACTIVE', 'PERMANENT', 'DESTROYED'],
    disposed:       ['PERMANENT'],
    actif:          ['SEMI_ACTIVE', 'PENDING', 'ACTIVE'],
    'intermédiaire': ['ACTIVE', 'PERMANENT', 'DESTROYED', 'SEMI_ACTIVE'],
    historique:     ['DESTROYED', 'PERMANENT'],
    détruit:        ['PERMANENT', 'DESTROYED'],
};

// Transitions reserved for administrators (struct 'all' with write access)
const ADMIN_ONLY_TRANSITIONS = new Set(['DESTROYED', 'disposed']);

// Statuses considered "validated" (boolean validated = true)
const VALIDATED_STATUSES = new Set([
    'ACTIVE', 'SEMI_ACTIVE', 'PERMANENT', 'DESTROYED',
    'validated', 'archived', 'disposed', 'actif', 'intermédiaire', 'historique', 'détruit'
]);

module.exports = async (req, res) => {
    const { targetStatus, note = '' } = req.body;

    if (!targetStatus) {
        return res.status(400).json({ error: 'targetStatus is required.' });
    }

    try {
        const archive = await Archive.findById(req.params.id);
        if (!archive) return res.status(404).json({ error: 'Archive not found.' });

        const currentStatus = archive.status || (archive.validated ? 'validated' : 'PENDING');

        const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
        if (!allowed.includes(targetStatus)) {
            return res.status(422).json({
                error: `Transition not allowed: ${currentStatus} → ${targetStatus}.`,
                allowedTransitions: allowed
            });
        }

        const user = await User.findById(res.locals.userId, { auth: 1 });
        const auth = await Auth.findById(user.auth);

        const archPriv = auth.privileges.find(p => p.app === 'archives');
        if (!archPriv) return res.status(403).json({ error: 'No archives privilege.' });

        const perms = archPriv.permissions;
        const isAdmin = perms.some(p => p.struct === 'all' && p.access === 'write');
        const hasWriteOnUnit = perms.some(
            p => (p.struct === archive.administrativeUnit || p.struct === 'all') && p.access === 'write'
        );

        if (ADMIN_ONLY_TRANSITIONS.has(targetStatus) && !isAdmin) {
            return res.status(403).json({ error: 'Only an administrator can perform this transition.' });
        }

        if (!hasWriteOnUnit) {
            return res.status(403).json({ error: 'Write access required on this administrative unit.' });
        }

        const historyEntry = {
            status: targetStatus,
            changedAt: new Date(),
            changedBy: res.locals.userId,
            note
        };

        const setFields = {
            status: targetStatus,
            validated: VALIDATED_STATUSES.has(targetStatus)
        };
        // Start DUA timer when transitioning to SEMI_ACTIVE
        if (targetStatus === 'SEMI_ACTIVE' && !archive.dua?.startDate) {
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
        res.status(500).json({ error: 'An error occurred.' });
    }
};

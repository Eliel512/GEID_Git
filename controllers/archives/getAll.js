'use strict';

const Archive = require('../../models/archives/archive.model');
const Role    = require('../../models/users/role.model');
const User    = require('../../models/users/user.model');

/**
 * GET /api/stuff/archives/:role
 *
 * Retourne les archives appartenant à une unité administrative (`administrativeUnit`)
 * identifiée par `role`, à condition que l'utilisateur connecté soit hiérarchiquement
 * supérieur (ou égal) à ce rôle.
 *
 * Paramètre :role = JSON.stringify({ role: string, type?: string })
 */
module.exports = async (req, res) => {
    // ── 1. Désérialisation du paramètre ─────────────────────────────────────────
    let parsed;
    try {
        parsed = JSON.parse(req.params.role);
    } catch {
        return res.status(400).json({ message: 'Paramètre invalide.' });
    }

    const { role: requestedRole, type } = parsed;
    if (!requestedRole) {
        return res.status(400).json({ message: 'Le champ "role" est requis.' });
    }

    try {
        // ── 2. Récupération du rôle de l'utilisateur connecté ───────────────────
        const user = await User.findOne({ _id: res.locals.userId });
        if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

        const userRole = user.grade?.['role'];

        // ── 3. Vérification de l'autorisation par remontée de la hiérarchie ─────
        // L'utilisateur est autorisé si son rôle === requestedRole
        // ou si son rôle est un ancêtre du rôle demandé dans l'arborescence.
        let currentRoleName = requestedRole;
        let authorized = (userRole === currentRoleName);

        while (!authorized) {
            const roleDoc = await Role.findOne({ name: currentRoleName });
            if (!roleDoc || !roleDoc['parent']) {
                // Hiérarchie épuisée sans match → accès refusé
                return res.status(403).json({ message: 'Accès non autorisé.' });
            }
            currentRoleName = roleDoc['parent'];
            authorized = (userRole === currentRoleName);
        }

        // ── 4. Récupération des archives ─────────────────────────────────────────
        const query = { administrativeUnit: requestedRole };
        let archives;

        if (type) {
            archives = await Archive.find(query).or([
                { 'type.type':    type },
                { 'type.subtype': type },
            ]);
        } else {
            archives = await Archive.find(query);
        }

        return res.status(200).json(archives);

    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Une erreur est survenue.' });
    }
};

'use strict';

/**
 * controllers/archives/users.js
 *
 * Gestion des utilisateurs dans le contexte du module Archives.
 *
 * Les utilisateurs visibles dépendent du cadre organique :
 *   - Un admin (struct='all') voit tous les utilisateurs
 *   - Un responsable voit les utilisateurs de son unité et des unités subordonnées
 *   - Un agent ne voit que les utilisateurs de sa propre unité
 *
 * Endpoints :
 *   GET  /api/stuff/archives/users          → liste filtrée par cadre organique
 *   GET  /api/stuff/archives/users/:id      → détail d'un utilisateur
 *   PUT  /api/stuff/archives/users/:id/permissions → modifier les permissions archives
 *   GET  /api/stuff/archives/roles          → liste des rôles (cadre organique)
 *   GET  /api/stuff/archives/auths          → liste des profils d'autorisation
 */

const User = require('../../models/users/user.model');
const Role = require('../../models/users/role.model');
const Auth = require('../../models/users/auth.model');

// ── Helper : récupérer tous les rôles subordonnés (récursif) ─────────────────

/**
 * À partir d'un nom de rôle, retourne tous les noms de rôles subordonnés
 * (enfants, petits-enfants, etc.) + le rôle lui-même.
 */
async function getSubordinateRoles(roleName) {
    const result = [roleName];
    const queue = [roleName];

    while (queue.length > 0) {
        const current = queue.shift();
        const role = await Role.findOne({ name: current });
        if (role && role.children && role.children.length > 0) {
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

// ── GET /api/stuff/archives/users ────────────────────────────────────────────

/**
 * Liste des utilisateurs filtrée par cadre organique.
 * Un admin voit tout le monde.
 * Un responsable voit son unité + subordonnées.
 */
exports.getUsers = async (req, res) => {
    try {
        const currentUser = await User.findById(res.locals.userId).populate('auth');
        if (!currentUser) return res.status(404).json({ message: 'Utilisateur introuvable.' });

        const auth = await Auth.findById(currentUser.auth);
        const archivePriv = auth?.privileges?.find(p => p.app === 'archives');

        // Vérifier si l'utilisateur a le droit de voir les utilisateurs
        if (!archivePriv || archivePriv.permissions.length === 0) {
            return res.status(403).json({ message: 'Accès non autorisé.' });
        }

        // Admin (struct='all') → voir tout le monde
        const isAdmin = archivePriv.permissions.some(p => p.struct === 'all' && p.access === 'write');

        let users;
        if (isAdmin) {
            users = await User.find({}, '-password -__v').populate('auth', 'name privileges');
        } else {
            // Récupérer les rôles autorisés (cadre organique)
            const allowedStructs = archivePriv.permissions.map(p => p.struct);
            const allAllowedRoles = [];

            for (const struct of allowedStructs) {
                const subordinates = await getSubordinateRoles(struct);
                allAllowedRoles.push(...subordinates);
            }

            // Dédoublonner
            const uniqueRoles = [...new Set(allAllowedRoles)];

            users = await User.find(
                { 'grade.role': { $in: uniqueRoles } },
                '-password -__v'
            ).populate('auth', 'name privileges');
        }

        res.status(200).json(users);
    } catch (error) {
        console.error('[archives/users]', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

// ── GET /api/stuff/archives/users/:id ────────────────────────────────────────

exports.getOneUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id, '-password -__v')
            .populate('auth', 'name privileges');
        if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });
        res.status(200).json(user);
    } catch (error) {
        console.error('[archives/users/:id]', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

// ── PUT /api/stuff/archives/users/:id/permissions ────────────────────────────

/**
 * Modifier les permissions archives d'un utilisateur.
 * Body : { permissions: [{ struct: string, access: 'read'|'write' }] }
 *
 * Seul un admin ou un utilisateur avec write sur 'all' peut modifier les permissions.
 */
exports.setPermissions = async (req, res) => {
    try {
        const { permissions } = req.body;
        if (!Array.isArray(permissions)) {
            return res.status(400).json({ message: 'Le champ "permissions" est requis (tableau).' });
        }

        // Vérifier que le demandeur est admin archives
        const currentUser = await User.findById(res.locals.userId);
        const currentAuth = await Auth.findById(currentUser?.auth);
        const archivePriv = currentAuth?.privileges?.find(p => p.app === 'archives');
        const isAdmin = archivePriv?.permissions?.some(p => p.struct === 'all' && p.access === 'write');

        if (!isAdmin) {
            return res.status(403).json({ message: 'Seul un administrateur peut modifier les permissions.' });
        }

        // Récupérer l'utilisateur cible et son auth
        const targetUser = await User.findById(req.params.id);
        if (!targetUser) return res.status(404).json({ message: 'Utilisateur introuvable.' });

        const targetAuth = await Auth.findById(targetUser.auth);
        if (!targetAuth) return res.status(404).json({ message: 'Profil d\'autorisation introuvable.' });

        // Mettre à jour les permissions archives
        const existingPrivIndex = targetAuth.privileges.findIndex(p => p.app === 'archives');
        if (existingPrivIndex >= 0) {
            targetAuth.privileges[existingPrivIndex].permissions = permissions;
        } else {
            targetAuth.privileges.push({ app: 'archives', permissions });
        }

        await targetAuth.save();

        res.status(200).json({
            message: 'Permissions mises à jour.',
            auth: targetAuth,
        });
    } catch (error) {
        console.error('[archives/users/:id/permissions]', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

// ── GET /api/stuff/archives/roles ────────────────────────────────────────────

exports.getRoles = async (_req, res) => {
    try {
        const roles = await Role.find().lean();
        res.status(200).json(roles);
    } catch (error) {
        console.error('[archives/roles]', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

// ── GET /api/stuff/archives/auths ────────────────────────────────────────────

exports.getAuths = async (_req, res) => {
    try {
        const auths = await Auth.find().lean();
        res.status(200).json(auths);
    } catch (error) {
        console.error('[archives/auths]', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

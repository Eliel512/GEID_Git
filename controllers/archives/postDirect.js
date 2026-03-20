'use strict';

/**
 * POST /api/stuff/archives/upload
 *
 * Direct archive creation with file upload (no workspace Doc reference needed).
 * Body (multipart/form-data):
 *   file        — the file to archive (req.file from multer memoryStorage)
 *   type        — document type string
 *   subtype     — document subtype string (optional)
 *   designation — archive title (required)
 *   description — archive description (required)
 *   folder      — activity/folder name (required)
 *
 * The file is saved to ARCHIVES/direct/<userId>/<filename>.
 */

const fs      = require('fs');
const path    = require('path');
const mime    = require('mime-types');
const Archive = require('../../models/archives/archive.model');
const Profil  = require('../../models/archives/profil.model');
const Folder  = require('../../models/archives/folder.model');
const Role    = require('../../models/users/role.model');
const User    = require('../../models/users/user.model');

module.exports = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier reçu.' });
    }

    const { type, subtype, designation, description, folder: folderName } = req.body;
    if (!designation || !description || !folderName || !type) {
        return res.status(400).json({ message: 'Champs obligatoires manquants : designation, description, folder, type.' });
    }

    try {
        // ── 1. Resolve user role ───────────────────────────────────────────
        const user = await User.findOne({ _id: res.locals.userId }, { 'grade.role': 1 });
        if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });
        const userRoleName = user.grade?.role;

        const userRole = await Role.findOne({ name: userRoleName }, { _id: 1, name: 1 });
        if (!userRole) return res.status(400).json({ message: 'Rôle introuvable.' });

        const defaultProfil = await Profil.findOne({ name: 'default' }, { _id: 1 });
        if (!defaultProfil) return res.status(500).json({ message: 'Profil par défaut introuvable.' });

        // ── 2. Ensure folder exists ────────────────────────────────────────
        let folderDoc = await Folder.findOne({ name: folderName });
        if (!folderDoc) {
            folderDoc = new Folder({ name: folderName, description });
            await folderDoc.save();
        }

        // ── 3. Write file to disk ──────────────────────────────────────────
        const mainDir   = path.dirname(require.main.filename);
        const ext       = mime.extension(req.file.mimetype) || 'bin';
        const safeName  = req.file.originalname
            .replace(/[^a-zA-Z0-9_\-\.]/g, '_');
        const fileName  = `${Date.now()}_${safeName}`;
        const dir       = path.join(mainDir, 'ARCHIVES', 'direct', String(res.locals.userId));

        fs.mkdirSync(dir, { recursive: true });
        const fullPath  = path.join(dir, fileName);
        fs.writeFileSync(fullPath, req.file.buffer);

        const relativeFileUrl = path.join('ARCHIVES', 'direct', String(res.locals.userId), fileName);

        // ── 4. Create archive record ───────────────────────────────────────
        const archive = new Archive({
            designation,
            description,
            type: {
                type,
                subtype: subtype || undefined,
                profil: defaultProfil._id,
            },
            folder: folderDoc._id,
            administrativeUnit: userRole._id,
            fileUrl: relativeFileUrl,
            status: 'PENDING',
            validated: false,
        });

        await archive.save();
        return res.status(201).json(archive);

    } catch (error) {
        console.error('[postDirect]', error);
        return res.status(500).json({ message: 'Une erreur est survenue lors de la création de l\'archive.' });
    }
};

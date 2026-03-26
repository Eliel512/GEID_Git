'use strict';

const path    = require('path');
const storage = require('../../tools/storage');
const Archive = require('../../models/archives/archive.model');
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const Profil  = require('../../models/archives/profil.model');
const Folder  = require('../../models/archives/folder.model');
const Role    = require('../../models/users/role.model');
const User    = require('../../models/users/user.model');

function normalizeFolder(name) {
    return name
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toUpperCase().trim();
}

module.exports = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'Aucun fichier reçu.' });
    }

    const { type, subtype, designation, description, folder: folderName, refNumber } = req.body;
    if (!designation || !description || !type) {
        return res.status(400).json({ message: 'Champs obligatoires manquants : designation, description, type.' });
    }

    try {
        const userId = res.locals.userId;

        const user = await User.findById(userId, 'grade.role');
        if (!user) return res.status(404).json({ message: 'Utilisateur introuvable.' });

        const userRole = await Role.findOne({ name: user.grade?.role }, '_id name');
        if (!userRole) return res.status(400).json({ message: 'Rôle introuvable.' });

        const defaultProfil = await Profil.findOne({ name: 'default' }, '_id');
        if (!defaultProfil) return res.status(500).json({ message: 'Profil par défaut introuvable.' });

        const resolvedFolderName = normalizeFolder(folderName || type || 'DIVERS');
        let folderDoc = await Folder.findOne({ name: resolvedFolderName });
        if (!folderDoc) {
            folderDoc = new Folder({ name: resolvedFolderName, description: resolvedFolderName });
            await folderDoc.save();
        }

        // Nom du fichier sécurisé
        const safeName = req.file.originalname.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
        const fileName = `${Date.now()}_${safeName}`;
        const archiveRelPath = `ARCHIVES/direct/${userId}/${fileName}`;

        // Upload vers MinIO uniquement
        await storage.uploadFile(archiveRelPath, req.file.buffer);

        // Copier aussi dans le workspace de l'utilisateur (MinIO + MongoDB)
        try {
            const wsRelPath = `workspace/${userId}/Documents/${fileName}`;
            await storage.uploadFile(wsRelPath, req.file.buffer);

            // Créer l'entrée WorkspaceFile
            await new WorkspaceFile({
                name: fileName,
                owner: userId,
                path: 'Documents',
                isDirectory: false,
                format: path.extname(fileName).slice(1),
                size: req.file.size,
                mimeType: req.file.mimetype,
                contentUrl: wsRelPath,
            }).save();
        } catch (err) {
            console.error('[postDirect] Workspace copy:', err.message);
        }

        // Créer l'archive
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
            fileUrl: archiveRelPath,
            status: 'PENDING',
            validated: false,
            ...(refNumber ? { refNumber } : {}),
        });

        await archive.save();
        res.status(201).json(archive);
    } catch (error) {
        console.error('[postDirect]', error);
        res.status(500).json({ message: 'Une erreur est survenue lors de la création de l\'archive.' });
    }
};

const Archive = require('../../models/archives/archive.model');
const Doc = require('../../models/archives/doc.model');
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const Profil = require('../../models/archives/profil.model');
const Folder = require('../../models/archives/folder.model');
const Role = require('../../models/users/role.model');
const User = require('../../models/users/user.model');
const path = require('path');
const storage = require('../../tools/storage');

/** Normalise un nom de dossier : majuscules, sans accents */
function normalizeFolder(name) {
    return name
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toUpperCase().trim();
}

module.exports = async (req, res) => {
    try {
        const docId = req.body.doc;

        // Chercher d'abord dans Doc (ancien système), puis dans WorkspaceFile (nouveau)
        let sourceFile = await Doc.findOne({ _id: docId }).lean();
        if (!sourceFile) {
            sourceFile = await WorkspaceFile.findOne({ _id: docId }).lean();
        }
        if (!sourceFile || !sourceFile.contentUrl) {
            return res.status(404).json({ message: 'Fichier source introuvable.' });
        }

        const contentUrl = sourceFile.contentUrl;

        // Récupérer le rôle de l'utilisateur
        const user = await User.findById(res.locals.userId, 'grade.role');
        if (!user?.grade?.role) return res.status(500).json({ message: 'Rôle utilisateur introuvable.' });

        const userRole = await Role.findOne({ name: user.grade.role }, '_id name');
        if (!userRole) return res.status(500).json({ message: 'Rôle introuvable.' });

        const defaultProfil = await Profil.findOne({ name: 'default' }, '_id');
        if (!defaultProfil) return res.status(500).json({ message: 'Profil par défaut introuvable.' });

        // Dossier d'archivage
        const folderName = normalizeFolder(req.body.folder || req.body.type?.type || 'DIVERS');
        let folder = await Folder.findOne({ name: folderName }, '_id');
        if (!folder) {
            folder = new Folder({ name: folderName, description: folderName });
            await folder.save();
        }

        // Chemin de destination dans ARCHIVES
        const getPath = require('../../tools/getRoleUrl');
        const fileUrl = await getPath(userRole.name);
        if (!fileUrl) return res.status(500).json({ message: 'Chemin d\'archivage introuvable.' });

        const fileName = path.basename(contentUrl);
        const archiveRelPath = path.join('ARCHIVES', fileUrl, fileName).replace(/\\/g, '/');

        // Copier le fichier depuis MinIO (source) vers MinIO (archives)
        try {
            const stream = await storage.getFileStream(contentUrl);
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            const buffer = Buffer.concat(chunks);

            // Vérifier si le fichier existe déjà dans archives
            const exists = await storage.fileExists(archiveRelPath);
            if (exists) {
                return res.status(409).json({
                    message: 'Ce fichier a déjà été archivé. Renommez-le s\'il s\'agit d\'une autre version.'
                });
            }

            await storage.uploadFile(archiveRelPath, buffer);
        } catch (err) {
            console.error('[postOne] Copie MinIO:', err.message);
            return res.status(500).json({ message: 'Impossible de copier le fichier vers les archives.' });
        }

        // Normalise subType
        const rawType = req.body.type || {};
        const subtype = rawType.subType || rawType.subtype || undefined;

        const newArchive = new Archive({
            designation: req.body.designation,
            description: req.body.description,
            type: {
                type: rawType.type,
                subtype,
                profil: defaultProfil._id,
            },
            folder: folder._id,
            administrativeUnit: userRole._id,
            fileUrl: archiveRelPath,
            tags: req.body.tags || [],
        });

        await newArchive.save();
        res.status(201).json(newArchive);
    } catch (error) {
        console.error('[postOne]', error);
        res.status(500).json({ message: 'Une erreur est survenue lors de l\'archivage.' });
    }
};

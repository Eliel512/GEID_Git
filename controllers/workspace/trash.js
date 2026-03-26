/**
 * trash.js — Corbeille workspace.
 *
 * Quand un fichier est mis en corbeille :
 * 1. Le fichier original dans MinIO est compressé (gzip) et déplacé vers workspace-trash/
 * 2. Le fichier original dans workspace/ est supprimé
 * 3. Les métadonnées restent intactes en MongoDB pour permettre la restauration
 *
 * Quand un fichier est restauré :
 * 1. Le fichier compressé est décompressé et remis dans workspace/
 * 2. Le fichier compressé dans workspace-trash/ est supprimé
 *
 * Quand un fichier est supprimé définitivement :
 * 1. Le fichier compressé dans workspace-trash/ est supprimé
 * 2. L'entrée MongoDB est supprimée
 */

const zlib = require('zlib');
const { promisify } = require('util');
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const ActivityLog = require('../../models/workspace/activityLog.model');
const storage = require('../../tools/storage');

exports.getTrash = async (req, res) => {
  const userId = res.locals.userId;
  try {
    const files = await WorkspaceFile.find({
      owner: userId,
      isTrashed: true,
    }).sort({ trashedAt: -1 }).lean();
    res.status(200).json(files);
  } catch {
    res.status(500).json({ message: 'Impossible de récupérer la corbeille.' });
  }
};

exports.moveToTrash = async (req, res) => {
  const userId = res.locals.userId;
  const { id } = req.params;
  try {
    const file = await WorkspaceFile.findOne({ _id: id, owner: userId });
    if (!file) return res.status(404).json({ message: 'Fichier introuvable.' });

    // Pour les fichiers (pas dossiers) : comprimer et déplacer vers workspace-trash/
    if (!file.isDirectory && file.contentUrl) {
      try {
        // Lire le fichier original depuis MinIO
        const stream = await storage.getFileStream(file.contentUrl);
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const originalBuffer = Buffer.concat(chunks);

        // Compresser avec gzip
        const compressed = await gzip(originalBuffer);

        // Stocker le compressé dans workspace-trash/
        const trashPath = file.contentUrl.replace('workspace/', 'workspace-trash/') + '.gz';
        await storage.uploadFile(trashPath, compressed);

        // Supprimer l'original de workspace/
        await storage.deleteFile(file.contentUrl);

        // Sauvegarder les métadonnées
        file.trashContentUrl = trashPath;
        file.originalSize = originalBuffer.length;
      } catch (err) {
        // Si la compression échoue, on met quand même en corbeille (soft delete)
        console.error('[trash.compress]', err.message);
      }
    }

    file.isTrashed = true;
    file.trashedAt = new Date();
    await file.save();

    new ActivityLog({
      userId,
      action: 'trash',
      targetId: file._id,
      targetName: file.name,
    }).save().catch(() => {});

    res.status(200).json({ message: 'Fichier déplacé dans la corbeille.' });
  } catch (err) {
    console.error('[trash.moveToTrash]', err);
    res.status(500).json({ message: 'Impossible de déplacer le fichier dans la corbeille.' });
  }
};

exports.restoreFromTrash = async (req, res) => {
  const userId = res.locals.userId;
  const { id } = req.params;
  try {
    const file = await WorkspaceFile.findOne({ _id: id, owner: userId, isTrashed: true });
    if (!file) return res.status(404).json({ message: 'Fichier introuvable dans la corbeille.' });

    // Pour les fichiers : décompresser et remettre en place
    if (!file.isDirectory && file.trashContentUrl) {
      try {
        // Lire le fichier compressé depuis workspace-trash/
        const stream = await storage.getFileStream(file.trashContentUrl);
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const compressed = Buffer.concat(chunks);

        // Décompresser
        const original = await gunzip(compressed);

        // Remettre dans workspace/
        await storage.uploadFile(file.contentUrl, original);

        // Supprimer le compressé
        await storage.deleteFile(file.trashContentUrl);
      } catch (err) {
        console.error('[trash.restore]', err.message);
      }
    }

    file.isTrashed = false;
    file.trashedAt = undefined;
    file.trashContentUrl = undefined;
    file.originalSize = undefined;
    await file.save();

    new ActivityLog({
      userId,
      action: 'restore',
      targetId: file._id,
      targetName: file.name,
    }).save().catch(() => {});

    res.status(200).json({ message: 'Fichier restauré.' });
  } catch (err) {
    console.error('[trash.restoreFromTrash]', err);
    res.status(500).json({ message: 'Impossible de restaurer le fichier.' });
  }
};

exports.permanentDelete = async (req, res) => {
  const userId = res.locals.userId;
  const { id } = req.params;
  try {
    const file = await WorkspaceFile.findOne({ _id: id, owner: userId, isTrashed: true });
    if (!file) return res.status(404).json({ message: 'Fichier introuvable.' });

    // Supprimer le fichier compressé dans workspace-trash/
    if (file.trashContentUrl) {
      storage.deleteFile(file.trashContentUrl).catch(() => {});
    }
    // Au cas où l'original existe encore (compression échouée)
    if (file.contentUrl) {
      storage.deleteFile(file.contentUrl).catch(() => {});
    }

    await WorkspaceFile.deleteOne({ _id: id });

    new ActivityLog({
      userId,
      action: 'delete',
      targetName: file.name,
      details: { permanent: true },
    }).save().catch(() => {});

    res.status(200).json({ message: 'Fichier supprimé définitivement.' });
  } catch {
    res.status(500).json({ message: 'Impossible de supprimer le fichier.' });
  }
};

exports.emptyTrash = async (req, res) => {
  const userId = res.locals.userId;
  try {
    const trashedFiles = await WorkspaceFile.find({ owner: userId, isTrashed: true });

    for (const file of trashedFiles) {
      if (file.trashContentUrl) {
        storage.deleteFile(file.trashContentUrl).catch(() => {});
      }
      if (file.contentUrl) {
        storage.deleteFile(file.contentUrl).catch(() => {});
      }
    }

    await WorkspaceFile.deleteMany({ owner: userId, isTrashed: true });

    new ActivityLog({
      userId,
      action: 'delete',
      targetName: 'corbeille',
      details: { permanent: true, count: trashedFiles.length },
    }).save().catch(() => {});

    res.status(200).json({ message: 'Corbeille vidée.', count: trashedFiles.length });
  } catch {
    res.status(500).json({ message: 'Impossible de vider la corbeille.' });
  }
};

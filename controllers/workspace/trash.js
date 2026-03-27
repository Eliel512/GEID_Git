const zlib = require('zlib');
const { promisify } = require('util');
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const ActivityLog = require('../../models/workspace/activityLog.model');
const storage = require('../../tools/storage');
const { escapeRegex } = require('./utils');

/** Compresse un fichier dans workspace-trash/ et supprime l'original */
async function compressToTrash(file) {
  if (file.isDirectory || !file.contentUrl) return;
  try {
    const stream = await storage.getFileStream(file.contentUrl);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    const compressed = await gzip(buffer);
    const trashPath = file.contentUrl.replace('workspace/', 'workspace-trash/') + '.gz';
    await storage.uploadFile(trashPath, compressed);
    await storage.deleteFile(file.contentUrl);
    file.trashContentUrl = trashPath;
    file.originalSize = buffer.length;
  } catch (err) {
    console.error('[trash.compress]', file.name, err.message);
  }
}

/** Décompresse un fichier depuis workspace-trash/ et restaure l'original */
async function restoreFromTrashStorage(file) {
  if (file.isDirectory || !file.trashContentUrl) return;
  try {
    const stream = await storage.getFileStream(file.trashContentUrl);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const original = await gunzip(Buffer.concat(chunks));
    await storage.uploadFile(file.contentUrl, original);
    await storage.deleteFile(file.trashContentUrl);
    file.trashContentUrl = undefined;
    file.originalSize = undefined;
  } catch (err) {
    console.error('[trash.restore]', file.name, err.message);
  }
}

/** Récupère un dossier + tous ses enfants (récursif) */
async function getFolderChildren(userId, file) {
  if (!file.isDirectory) return [];
  const folderPath = file.path ? `${file.path}/${file.name}` : file.name;
  return WorkspaceFile.find({
    owner: userId,
    $or: [
      { path: folderPath },
      { path: { $regex: `^${escapeRegex(folderPath)}/` } },
    ],
  });
}

exports.getTrash = async (req, res) => {
  const userId = res.locals.userId;
  try {
    const files = await WorkspaceFile.find({ owner: userId, isTrashed: true })
      .sort({ trashedAt: -1 }).lean();
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

    if (file.isDirectory) {
      // Dossier : mettre en corbeille le dossier + tous ses enfants
      const children = await getFolderChildren(userId, file);
      for (const child of children) {
        if (!child.isTrashed) {
          await compressToTrash(child);
          child.isTrashed = true;
          child.trashedAt = new Date();
          await child.save();
        }
      }
    } else {
      // Fichier : comprimer dans workspace-trash/
      await compressToTrash(file);
    }

    file.isTrashed = true;
    file.trashedAt = new Date();
    await file.save();

    new ActivityLog({ userId, action: 'trash', targetId: file._id, targetName: file.name })
      .save().catch(() => {});

    res.status(200).json({ message: file.isDirectory ? 'Dossier déplacé dans la corbeille.' : 'Fichier déplacé dans la corbeille.' });
  } catch (err) {
    console.error('[trash.moveToTrash]', err);
    res.status(500).json({ message: 'Impossible de déplacer dans la corbeille.' });
  }
};

exports.restoreFromTrash = async (req, res) => {
  const userId = res.locals.userId;
  const { id } = req.params;
  try {
    const file = await WorkspaceFile.findOne({ _id: id, owner: userId, isTrashed: true });
    if (!file) return res.status(404).json({ message: 'Fichier introuvable dans la corbeille.' });

    if (file.isDirectory) {
      // Dossier : restaurer le dossier + tous ses enfants
      const children = await getFolderChildren(userId, file);
      for (const child of children) {
        if (child.isTrashed) {
          await restoreFromTrashStorage(child);
          child.isTrashed = false;
          child.trashedAt = undefined;
          child.trashContentUrl = undefined;
          child.originalSize = undefined;
          await child.save();
        }
      }
    } else {
      await restoreFromTrashStorage(file);
    }

    file.isTrashed = false;
    file.trashedAt = undefined;
    file.trashContentUrl = undefined;
    file.originalSize = undefined;
    await file.save();

    new ActivityLog({ userId, action: 'restore', targetId: file._id, targetName: file.name })
      .save().catch(() => {});

    res.status(200).json({ message: file.isDirectory ? 'Dossier restauré.' : 'Fichier restauré.' });
  } catch (err) {
    console.error('[trash.restoreFromTrash]', err);
    res.status(500).json({ message: 'Impossible de restaurer.' });
  }
};

exports.permanentDelete = async (req, res) => {
  const userId = res.locals.userId;
  const { id } = req.params;
  try {
    const file = await WorkspaceFile.findOne({ _id: id, owner: userId, isTrashed: true });
    if (!file) return res.status(404).json({ message: 'Fichier introuvable.' });

    if (file.isDirectory) {
      // Supprimer tous les enfants
      const children = await getFolderChildren(userId, file);
      for (const child of children) {
        if (child.trashContentUrl) storage.deleteFile(child.trashContentUrl).catch(() => {});
        if (child.contentUrl) storage.deleteFile(child.contentUrl).catch(() => {});
        await WorkspaceFile.deleteOne({ _id: child._id });
      }
    } else {
      if (file.trashContentUrl) storage.deleteFile(file.trashContentUrl).catch(() => {});
      if (file.contentUrl) storage.deleteFile(file.contentUrl).catch(() => {});
    }

    await WorkspaceFile.deleteOne({ _id: id });

    new ActivityLog({ userId, action: 'delete', targetName: file.name, details: { permanent: true } })
      .save().catch(() => {});

    res.status(200).json({ message: 'Supprimé définitivement.' });
  } catch {
    res.status(500).json({ message: 'Impossible de supprimer.' });
  }
};

exports.emptyTrash = async (req, res) => {
  const userId = res.locals.userId;
  try {
    const trashedFiles = await WorkspaceFile.find({ owner: userId, isTrashed: true });

    for (const file of trashedFiles) {
      if (file.trashContentUrl) storage.deleteFile(file.trashContentUrl).catch(() => {});
      if (file.contentUrl) storage.deleteFile(file.contentUrl).catch(() => {});
    }

    await WorkspaceFile.deleteMany({ owner: userId, isTrashed: true });

    new ActivityLog({ userId, action: 'delete', targetName: 'corbeille', details: { permanent: true, count: trashedFiles.length } })
      .save().catch(() => {});

    res.status(200).json({ message: 'Corbeille vidée.', count: trashedFiles.length });
  } catch {
    res.status(500).json({ message: 'Impossible de vider la corbeille.' });
  }
};

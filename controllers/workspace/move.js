const paths = require('path');
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const ActivityLog = require('../../models/workspace/activityLog.model');
const storage = require('../../tools/storage');
const { escapeRegex } = require('./utils');

exports.moveFile = async (req, res) => {
  const userId = res.locals.userId;
  const { fileId, destinationPath } = req.body;

  if (!fileId || typeof destinationPath !== 'string') {
    return res.status(400).json({ message: 'Paramètres invalides.' });
  }

  try {
    const file = await WorkspaceFile.findOne({ _id: fileId, owner: userId });
    if (!file) return res.status(404).json({ message: 'Fichier introuvable.' });

    const oldPath = file.path;

    if (file.isDirectory) {
      // ── Déplacer un dossier ──
      const oldFolderPath = oldPath ? `${oldPath}/${file.name}` : file.name;
      const newFolderPath = destinationPath ? `${destinationPath}/${file.name}` : file.name;

      // Empêcher de déplacer un dossier dans lui-même
      if (newFolderPath === oldFolderPath || newFolderPath.startsWith(oldFolderPath + '/')) {
        return res.status(400).json({ message: 'Impossible de déplacer un dossier dans lui-même.' });
      }

      // Déplacer les fichiers dans MinIO
      const oldMinioPrefix = ['workspace', userId, oldFolderPath].filter(Boolean).join('/');
      const newMinioPrefix = ['workspace', userId, newFolderPath].filter(Boolean).join('/');
      await storage.renameDirPrefix(oldMinioPrefix, newMinioPrefix);

      // Mettre à jour le dossier lui-même
      file.path = destinationPath;
      await file.save();

      // Mettre à jour tous les enfants directs (path === oldFolderPath)
      await WorkspaceFile.updateMany(
        { owner: userId, path: oldFolderPath },
        { path: newFolderPath }
      );

      // Mettre à jour les enfants imbriqués (path commence par oldFolderPath/)
      const prefix = oldFolderPath + '/';
      const children = await WorkspaceFile.find({
        owner: userId,
        path: { $regex: `^${escapeRegex(prefix)}` },
      });
      for (const child of children) {
        const updatedPath = newFolderPath + '/' + child.path.slice(prefix.length);
        child.path = updatedPath;
        if (child.contentUrl) {
          child.contentUrl = child.contentUrl.replace(
            `${userId}/${oldFolderPath}/`,
            `${userId}/${newFolderPath}/`
          );
        }
        await child.save();
      }
    } else {
      // ── Déplacer un fichier ──
      const oldParts = ['workspace', userId, file.path, file.name].filter(Boolean);
      const newParts = ['workspace', userId, destinationPath, file.name].filter(Boolean);
      const oldRelPath = oldParts.join('/');
      const newRelPath = newParts.join('/');

      await storage.renameFile(oldRelPath, newRelPath);

      file.path = destinationPath;
      file.contentUrl = newRelPath;
      await file.save();
    }

    new ActivityLog({
      userId,
      action: 'move',
      targetId: file._id,
      targetName: file.name,
      details: { from: oldPath, to: destinationPath, isDirectory: file.isDirectory },
    }).save().catch(() => {});

    const io = require('../../socketStore').getInstance();
    if (io) {
      io.emit('workspace:file-moved', {
        userId, fileId: file._id, fileName: file.name,
        fromPath: oldPath, toPath: destinationPath,
      });
    }

    res.status(200).json({ message: file.isDirectory ? 'Dossier déplacé.' : 'Fichier déplacé.', file });
  } catch (err) {
    console.error('[workspace.move]', err);
    res.status(500).json({ message: 'Erreur lors du déplacement.' });
  }
};

exports.copyFile = async (req, res) => {
  const userId = res.locals.userId;
  const { fileId, destinationPath } = req.body;

  if (!fileId || typeof destinationPath !== 'string') {
    return res.status(400).json({ message: 'Paramètres invalides.' });
  }

  try {
    const file = await WorkspaceFile.findOne({ _id: fileId, owner: userId });
    if (!file) return res.status(404).json({ message: 'Fichier introuvable.' });

    // Copy in MinIO
    const srcParts = ['workspace', userId, file.path, file.name].filter(Boolean);
    const destParts = ['workspace', userId, destinationPath, file.name].filter(Boolean);
    const srcRelPath = srcParts.join('/');
    const destRelPath = destParts.join('/');

    await storage.copyFile(srcRelPath, destRelPath);

    const copy = new WorkspaceFile({
      name: file.name,
      owner: userId,
      path: destinationPath,
      isDirectory: false,
      format: file.format,
      size: file.size,
      mimeType: file.mimeType,
      contentUrl: destRelPath,
      tags: file.tags,
    });
    await copy.save();

    new ActivityLog({
      userId,
      action: 'copy',
      targetId: copy._id,
      targetName: file.name,
      details: { from: file.path, to: destinationPath },
    }).save().catch(() => {});

    res.status(201).json({ message: 'Fichier copié.', file: copy });
  } catch (err) {
    console.error('[workspace.copy]', err);
    res.status(500).json({ message: 'Erreur lors de la copie.' });
  }
};

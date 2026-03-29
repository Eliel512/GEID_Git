const paths = require('path');
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const Doc = require('../../models/archives/doc.model');

/** Échappe les caractères spéciaux regex pour éviter l'injection ReDoS/NoSQL */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Valide un nom de dossier (pas de caractères spéciaux de chemin) */
function isValidFolderName(name) {
  return /^[^/\\:*?"<>|]+$/.test(name.trim());
}

/**
 * Liste les fichiers d'un répertoire depuis MongoDB (source de vérité).
 * @param {string} userId — identifiant du propriétaire
 * @param {string} subPath — chemin parent ("" pour la racine)
 * @param {string} getHost — hostname pour construire les URLs
 * @returns {Promise<Array>}
 */
async function listFromDB(userId, subPath, getHost) {
  const normalizedPath = subPath || '';

  const files = await WorkspaceFile.find({
    owner: userId,
    path: normalizedPath,
    isTrashed: { $ne: true },
  }).lean();

  const result = [];
  for (const file of files) {
    let doc = null;
    let count = undefined;

    if (file.isDirectory) {
      const childPath = normalizedPath ? normalizedPath + '/' + file.name : file.name;
      count = await WorkspaceFile.countDocuments({
        owner: userId,
        path: childPath,
        isTrashed: { $ne: true },
      });
    } else {
      const contentUrl = [
        'workspace', userId, normalizedPath, file.name,
      ].filter(Boolean).join('/');
      doc = await Doc.findOne({ owner: userId, contentUrl }).lean();
    }

    const urlPath = [userId, normalizedPath, file.name].filter(Boolean).join('/');
    result.push({
      _id: file._id,
      name: file.name,
      url: file.isDirectory ? null : `https://${getHost}/api/stuff/workspace/file/${urlPath}`,
      createdAt: file.updatedAt || file.createdAt,
      size: file.size || 0,
      isDirectory: file.isDirectory || false,
      color: file.color || null,
      tags: file.tags || [],
      duration: file.duration || null,
      durationSeconds: file.durationSeconds || null,
      videoWidth: file.videoWidth || null,
      videoHeight: file.videoHeight || null,
      isFavorite: file.isFavorite || false,
      doc,
      ...(file.isDirectory ? { count } : {}),
    });
  }

  result.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return result;
}

module.exports = {
  escapeRegex,
  isValidFolderName,
  listFromDB,
};

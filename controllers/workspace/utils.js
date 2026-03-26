const paths = require('path');
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const Doc = require('../../models/archives/doc.model');

const WORKSPACE_BASE = paths.resolve('workspace');

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
 * @param {string} subPath — chemin parent ("" pour la racine, "dossier" pour un sous-dossier)
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
      // Count children of this directory
      const childPath = normalizedPath ? normalizedPath + '/' + file.name : file.name;
      count = await WorkspaceFile.countDocuments({
        owner: userId,
        path: childPath,
        isTrashed: { $ne: true },
      });
    } else {
      // Build URL and look up Doc record
      doc = await Doc.findOne({
        owner: userId,
        contentUrl: paths.join('workspace', userId, normalizedPath, file.name),
      }).lean();

      // Update lastAccessedAt
      WorkspaceFile.findByIdAndUpdate(file._id, { lastAccessedAt: new Date() })
        .catch(() => {});
    }

    const urlPath = [userId, normalizedPath, file.name].filter(Boolean).join('/');
    result.push({
      name: file.name,
      url: file.isDirectory ? null : `https://${getHost}/api/stuff/workspace/file/${encodeURIComponent(urlPath)}`,
      createdAt: file.updatedAt || file.createdAt,
      size: file.size || 0,
      isDirectory: file.isDirectory || false,
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

/** Vérifie qu'un chemin résolu reste dans le répertoire base autorisé (legacy — utilisé par d'autres controllers) */
function safePath(base, ...parts) {
  const resolved = paths.resolve(base, ...parts);
  if (!resolved.startsWith(base + paths.sep) && resolved !== base) {
    return null;
  }
  return resolved;
}

/** @deprecated Utilisé par modify.js et delete.js — à migrer vers listFromDB */
const fs = require('fs');
function listDirectory(targetDir, userId, subPath, getHost) {
  return new Promise((resolve, reject) => {
    fs.readdir(targetDir, (err, files) => {
      if (err) return reject(err);
      const result = [];
      for (const file of files) {
        let stat;
        try {
          stat = fs.statSync(paths.join(targetDir, file));
        } catch (e) {
          continue;
        }
        result.push({
          name: file,
          url: stat.isDirectory() ? null : `https://${getHost}/api/stuff/workspace/file/${encodeURIComponent(userId + '/' + subPath + '/' + file)}`,
          createdAt: stat.mtime,
          size: stat.isDirectory() ? 0 : stat.size,
          isDirectory: stat.isDirectory(),
        });
      }
      result.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      resolve(result);
    });
  });
}

module.exports = {
  WORKSPACE_BASE,
  escapeRegex,
  safePath,
  listDirectory,
  isValidFolderName,
  listFromDB,
};

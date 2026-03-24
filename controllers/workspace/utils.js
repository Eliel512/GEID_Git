const paths = require('path');
const fs = require('fs');

const WORKSPACE_BASE = paths.resolve('workspace');

/** Échappe les caractères spéciaux regex pour éviter l'injection ReDoS/NoSQL */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Vérifie qu'un chemin résolu reste dans le répertoire base autorisé */
function safePath(base, ...parts) {
  const resolved = paths.resolve(base, ...parts);
  if (!resolved.startsWith(base + paths.sep) && resolved !== base) {
    return null;
  }
  return resolved;
}

/** Lit un répertoire et retourne la liste des fichiers avec leurs stats */
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

/** Valide un nom de dossier (pas de caractères spéciaux de chemin) */
function isValidFolderName(name) {
  return /^[^/\\:*?"<>|]+$/.test(name.trim());
}

module.exports = {
  WORKSPACE_BASE,
  escapeRegex,
  safePath,
  listDirectory,
  isValidFolderName,
};

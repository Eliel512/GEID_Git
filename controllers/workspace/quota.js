const fs = require('fs');
const paths = require('path');
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const { WORKSPACE_BASE } = require('./utils');

// Default quota: 5 GB
const DEFAULT_QUOTA = 5 * 1024 * 1024 * 1024;

/**
 * Calcule récursivement la taille d'un répertoire.
 */
function getDirSize(dirPath) {
  let totalSize = 0;
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = paths.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        totalSize += getDirSize(fullPath);
      } else {
        try {
          totalSize += fs.statSync(fullPath).size;
        } catch { /* skip inaccessible files */ }
      }
    }
  } catch { /* directory doesn't exist or not readable */ }
  return totalSize;
}

exports.getQuota = async (req, res) => {
  const userId = res.locals.userId;
  try {
    // D'abord essayer via MongoDB (WorkspaceFile)
    const result = await WorkspaceFile.aggregate([
      { $match: { owner: userId, isDirectory: false } },
      { $group: { _id: null, totalSize: { $sum: '$size' } } },
    ]);

    let used = result.length > 0 ? result[0].totalSize : 0;

    // Si MongoDB retourne 0 (fichiers pas encore migrés), calculer depuis le filesystem
    if (used === 0) {
      const userDir = paths.join(WORKSPACE_BASE, userId);
      used = getDirSize(userDir);
    }

    res.status(200).json({ used, total: DEFAULT_QUOTA });
  } catch {
    res.status(500).json({ message: 'Impossible de calculer le quota.' });
  }
};

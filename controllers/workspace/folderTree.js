const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const ActivityLog = require('../../models/workspace/activityLog.model');
const { isValidFolderName } = require('./utils');

/**
 * POST /api/stuff/workspace/folder/tree
 *
 * Crée une arborescence de dossiers en une seule requête.
 * Body: { basePath: string, folders: string[] }
 *   - basePath: chemin parent ("" pour la racine, "Documents" pour un sous-dossier)
 *   - folders: liste de chemins relatifs à créer (ex: ["photos", "photos/vacances", "docs"])
 *
 * Retourne les dossiers créés.
 */
exports.createFolderTree = async (req, res) => {
  const userId = res.locals.userId;
  const { basePath, folders } = req.body;

  if (!Array.isArray(folders) || typeof basePath !== 'string') {
    return res.status(400).json({ message: 'Paramètres invalides.' });
  }

  try {
    const created = [];

    // Trier par profondeur (parents d'abord)
    const sorted = [...folders].sort((a, b) => a.split('/').length - b.split('/').length);

    for (const folderPath of sorted) {
      const parts = folderPath.split('/').filter(Boolean);
      if (parts.length === 0) continue;

      // Valider chaque segment
      const invalid = parts.find(p => !isValidFolderName(p));
      if (invalid) continue;

      // Construire le chemin complet du parent et le nom du dossier
      const folderName = parts[parts.length - 1];
      const parentParts = parts.slice(0, -1);
      const parentPath = basePath
        ? (parentParts.length > 0 ? `${basePath}/${parentParts.join('/')}` : basePath)
        : parentParts.join('/');

      // Vérifier si le dossier existe déjà
      const existing = await WorkspaceFile.findOne({
        owner: userId,
        path: parentPath,
        name: folderName,
        isDirectory: true,
        isTrashed: { $ne: true },
      });

      if (!existing) {
        await new WorkspaceFile({
          name: folderName,
          owner: userId,
          path: parentPath,
          isDirectory: true,
        }).save();
        created.push({ name: folderName, path: parentPath });
      }
    }

    // Activity log
    if (created.length > 0) {
      new ActivityLog({
        userId,
        action: 'create',
        targetName: `${created.length} dossier(s)`,
        details: { basePath, folders: created.map(c => c.name) },
      }).save().catch(() => {});
    }

    res.status(201).json({ message: `${created.length} dossier(s) créé(s)`, created });
  } catch (error) {
    console.error('[workspace.createFolderTree]', error);
    res.status(500).json({ message: 'Erreur lors de la création des dossiers.' });
  }
};

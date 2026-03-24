const Doc = require('../models/archives/doc.model');
const getHost = require('./getHost').getHost();
const fs = require('fs');
const mime = require('mime-types');
const paths = require('path');
const docEvent = require('../events/doc');
const storage = require('../tools/storage');

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

exports.create = (req, res, next) => {
  const userId = res.locals.userId;
  const extension = mime.extension(req.file.mimetype);
  const filename = req.body.filename + '.' + extension;
  const { path } = req.body;
  fs.access(`./workspace/${userId}/${path}/${filename}`, err => {
    if(err){
      console.log(err);
      res.status(500).json({ message: 'Erreur interne du serveur' });
    }else{
      const contentRelPath = paths.join('workspace', userId, path, filename);
      // Dual-write: upload to MinIO
      const localAbsPath = paths.resolve('./workspace', userId, path, filename);
      storage.uploadFileFromDisk(contentRelPath, localAbsPath).catch(err => {
          console.error('[MinIO upload] workspace.create:', err.message);
      });
      const doc = new Doc({
        ...req.body,
        format: extension,
        owner: userId,
        contentUrl: contentRelPath
      });
      doc.save()
        .then(() => {
          docEvent.emit('create', {
            _id: doc._id,
            format: doc.format,
            contentUrl: doc.contentUrl,
            author: userId
          });
          const result = [];
          fs.readdir(`./workspace/${userId}/${path}`, (err, files) => {
            if (err) {
              console.log(err);
              return res.status(500).json({ message: 'Une erreur est survenue' });
            } else {
              for (let file of files) {
                let stat;
                try {
                  stat = fs.statSync(`./workspace/${userId}/${path}/${file}`);
                } catch (error) {
                  console.log(error);
                  return res.status(500).json({ message: 'Une erreur est survenue' });
                }
                result.push({
                  'name': file,
                  'url': stat.isDirectory() ? null : `https://${getHost}/workspace/${userId}/${path}/${file}`,
                  'createdAt': stat.mtime,
                  'isDirectory': stat.isDirectory(),
                  'doc': stat.isDirectory() ? null : { ...doc._doc }
                });
              }
              res.status(201).json(result);
            }
          });
        })
        .catch(error => {
          console.log(error);
          res.status(500).json({ message: 'Une erreur est survenue' });
        })
    }
  })
};

exports.modify = (req, res, next) => {
  const userId = res.locals.userId;
  const extension = paths.extname(req.body.oldFilename);
  const filename = req.body.filename.split(' ').join('_') + extension;
  const { path } = req.body;
  fs.rename(`./workspace/${userId}/${path}/${req.body.oldFilename}`,
  `./workspace/${req.body.userId}/${req.body.path}/${filename}`,
   err => {
    if(err){
      console.log(err);
      res.status(500).json({ message: 'Erreur interne du serveur' });
    }else{
      // Dual-write: rename in MinIO
      const oldRelPath = paths.join('workspace', userId, path, req.body.oldFilename);
      const newRelPath = paths.join('workspace', req.body.userId, req.body.path, filename);
      storage.renameFile(oldRelPath, newRelPath).catch(err2 => {
          console.error('[MinIO rename] workspace.modify:', err2.message);
      });
      const result = [];
      fs.readdir(`./workspace/${userId}/${path}`, (err, files) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ message: 'Une erreur est survenue' });
        } else {
          for (let file of files) {
            let stat;
            try {
              stat = fs.statSync(`./workspace/${userId}/${path}/${file}`);
            } catch (error) {
              console.log(error);
              return res.status(500).json({ message: 'Une erreur est survenue' });
            }
            result.push({
              'name': file,
              'url': stat.isDirectory() ? null : `https://${getHost}/workspace/${userId}/${path}/${file}`,
              'createdAt': stat.mtime,
              'isDirectory': stat.isDirectory()
            });
          }
          res.status(200).json(result);
        }
      });
    }
  })
};

exports.delete = (req, res, next) => {
  const userId = res.locals.userId;
  let parsed;
  try {
    parsed = JSON.parse(req.params.data);
  } catch {
    return res.status(400).json({ message: 'Paramètre invalide.' });
  }
  const subPath = parsed["path"];
  const filename = parsed["filename"];

  if (!subPath || !filename || typeof subPath !== 'string' || typeof filename !== 'string') {
    return res.status(400).json({ message: 'Paramètre invalide.' });
  }

  const targetDir  = safePath(WORKSPACE_BASE, userId, subPath);
  const targetFile = targetDir && safePath(WORKSPACE_BASE, userId, subPath, filename);
  if (!targetDir || !targetFile) {
    return res.status(400).json({ message: 'Chemin non autorisé.' });
  }

  fs.unlink(targetFile, err => {
    if(err){
      console.log(err);
      res.status(500).json({ message: 'Une erreur est survenue' });
    }else{
      // Dual-write: delete from MinIO
      const delRelPath = paths.join('workspace', userId, subPath, filename);
      storage.deleteFile(delRelPath).catch(err2 => {
          console.error('[MinIO delete] workspace.delete:', err2.message);
      });
      const result = [];
      fs.readdir(targetDir, (err, files) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ message: 'Une erreur est survenue' });
        } else {
          for (let file of files) {
            let stat;
            try {
              stat = fs.statSync(paths.join(targetDir, file));
            } catch (error) {
              console.log(error);
              return res.status(500).json({ message: 'Une erreur est survenue' });
            }
            result.push({
              'name': file,
              'url': stat.isDirectory() ? null : `https://${getHost}/workspace/${userId}/${subPath}/${file}`,
              'createdAt': stat.mtime,
              'isDirectory': stat.isDirectory()
            });
          }
          res.status(200).json(result);
        }
      });
    }
  })
};

exports.getAll = (req, res, next) => {
  const userId = res.locals.userId;
  let parsed;
  try {
    parsed = JSON.parse(req.params.data);
  } catch {
    return res.status(400).json({ message: 'Paramètre invalide.' });
  }
  const subPath = parsed["path"];
  if (!subPath || typeof subPath !== 'string') {
    return res.status(400).json({ message: 'Paramètre invalide.' });
  }
  const targetDir = safePath(WORKSPACE_BASE, userId, subPath);
  if (!targetDir) {
    return res.status(400).json({ message: 'Chemin non autorisé.' });
  }
  let result = [];
  try {
    fs.mkdirSync(targetDir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.log(error);
      return res.status(500).json({ message: 'Une erreur est survenue' });
    }
  }
  fs.readdir(targetDir, async (err, files) => {
    if(err){
      console.log(err);
      return res.status(500).json({ message: 'Une erreur est survenue' });
    }else{
      for(let file of files){
        let stat;
        try {
          stat = fs.statSync(paths.join(targetDir, file));
        } catch (error) {
          console.log(error);
          return res.status(500).json({ message: 'Une erreur est survenue' });
        }
        const isDirectory = stat.isDirectory();
        const url = isDirectory ? null : `https://${getHost}/workspace/${userId}/${subPath}/${file}`;
        const doc = isDirectory ? null : await Doc.findOne({
          owner: userId,
          contentUrl: paths.join('workspace', userId, subPath, file)
        });
        result.push({
          'name': file,
          'url': url,
          'createdAt': stat.mtime,
          'isDirectory': isDirectory,
          'doc': doc
        });
      }
      // Dossiers en premier, puis fichiers, alphabétique dans chaque groupe
      result.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      res.status(200).json(result);
    }
  });
};

/** POST /api/stuff/workspace/folder
 *  Body: { path: string, folderName: string }
 *  Crée un nouveau sous-dossier dans le workspace de l'utilisateur.
 */
exports.createFolder = (req, res) => {
  const userId = res.locals.userId;
  const { path: subPath, folderName } = req.body;

  if (!subPath || !folderName || typeof subPath !== 'string' || typeof folderName !== 'string') {
    return res.status(400).json({ message: 'Paramètres invalides.' });
  }
  // Nom de dossier : alphanumérique, tirets, underscores, espaces — pas de / ou ..
  if (!/^[^/\\:*?"<>|]+$/.test(folderName.trim())) {
    return res.status(400).json({ message: 'Nom de dossier invalide.' });
  }

  const targetDir = safePath(WORKSPACE_BASE, userId, subPath);
  const newDir    = targetDir && safePath(WORKSPACE_BASE, userId, subPath, folderName.trim());
  if (!targetDir || !newDir) {
    return res.status(400).json({ message: 'Chemin non autorisé.' });
  }

  try {
    fs.mkdirSync(newDir, { recursive: false });
    // Dual-write: ensureDir in MinIO (no-op, but keeps intent clear)
    storage.ensureDir(paths.join('workspace', userId, subPath, folderName.trim())).catch(() => {});
    res.status(201).json({ message: 'Dossier créé', name: folderName.trim(), isDirectory: true });
  } catch (e) {
    if (e.code === 'EEXIST') return res.status(409).json({ message: 'Ce dossier existe déjà.' });
    console.log(e);
    res.status(500).json({ message: 'Une erreur est survenue lors de la création du dossier.' });
  }
};

/** DELETE /api/stuff/workspace/folder/:data
 *  Param: JSON { path: string, folderName: string }
 *  Supprime un dossier et tout son contenu.
 */
exports.deleteFolder = (req, res) => {
  const userId = res.locals.userId;
  let parsed;
  try {
    parsed = JSON.parse(req.params.data);
  } catch {
    return res.status(400).json({ message: 'Paramètre invalide.' });
  }
  const { path: subPath, folderName } = parsed;

  if (!subPath || !folderName || typeof subPath !== 'string' || typeof folderName !== 'string') {
    return res.status(400).json({ message: 'Paramètres invalides.' });
  }

  const targetFolder = safePath(WORKSPACE_BASE, userId, subPath, folderName);
  if (!targetFolder) {
    return res.status(400).json({ message: 'Chemin non autorisé.' });
  }

  // Vérifier que c'est bien un dossier
  try {
    const stat = fs.statSync(targetFolder);
    if (!stat.isDirectory()) {
      return res.status(400).json({ message: 'Le chemin spécifié n\'est pas un dossier.' });
    }
  } catch {
    return res.status(404).json({ message: 'Dossier introuvable.' });
  }

  try {
    fs.rmSync(targetFolder, { recursive: true, force: false });
    // Dual-write: delete directory prefix in MinIO
    storage.deleteDir(paths.join('workspace', userId, subPath, folderName)).catch(err2 => {
        console.error('[MinIO deleteDir] workspace.deleteFolder:', err2.message);
    });
    res.status(200).json({ message: 'Dossier supprimé' });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: 'Erreur lors de la suppression du dossier.' });
  }
};

/** PUT /api/stuff/workspace/folder
 *  Body: { path: string, oldName: string, newName: string }
 *  Renomme un dossier.
 */
exports.renameFolder = (req, res) => {
  const userId = res.locals.userId;
  const { path: subPath, oldName, newName } = req.body;

  if (!subPath || !oldName || !newName) {
    return res.status(400).json({ message: 'Paramètres invalides.' });
  }
  if (!/^[^/\\:*?"<>|]+$/.test(newName.trim())) {
    return res.status(400).json({ message: 'Nom de dossier invalide.' });
  }

  const oldPath = safePath(WORKSPACE_BASE, userId, subPath, oldName.trim());
  const newPath = safePath(WORKSPACE_BASE, userId, subPath, newName.trim());
  if (!oldPath || !newPath) {
    return res.status(400).json({ message: 'Chemin non autorisé.' });
  }

  try {
    fs.renameSync(oldPath, newPath);
    // Dual-write: renomme tous les objets dans MinIO
    const oldRel = path.join('workspace', userId, subPath, oldName.trim());
    const newRel = path.join('workspace', userId, subPath, newName.trim());
    storage.renameDirPrefix(oldRel, newRel).catch(e => console.error('[MinIO] workspace.renameFolder:', e.message));
    res.status(200).json({ message: 'Dossier renommé', name: newName.trim() });
  } catch (e) {
    if (e.code === 'ENOENT') return res.status(404).json({ message: 'Dossier introuvable.' });
    if (e.code === 'EEXIST') return res.status(409).json({ message: 'Un dossier avec ce nom existe déjà.' });
    console.log(e);
    res.status(500).json({ message: 'Erreur lors du renommage.' });
  }
};

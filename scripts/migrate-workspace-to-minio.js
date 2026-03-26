#!/usr/bin/env node
/**
 * Migration script: Workspace filesystem → MinIO + MongoDB
 *
 * 1. Scanne workspace/{userId}/{category}/... sur le disque
 * 2. Upload chaque fichier vers MinIO (workspace bucket)
 * 3. Crée les entrées WorkspaceFile dans MongoDB
 * 4. Restructure: déplace les fichiers des anciens dossiers catégorie
 *    (documents, images, videos, others) vers la racine de l'user
 *    en créant des sous-dossiers Documents, Images, Videos, Autres
 * 5. Crée les 4 dossiers par défaut pour chaque user
 *
 * Usage: node scripts/migrate-workspace-to-minio.js
 * (Exécuter depuis le répertoire GEID_Git)
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const WorkspaceFile = require('../models/workspace/workspaceFile.model');
const storage = require('../tools/storage');

const WORKSPACE_DIR = path.resolve('workspace');

// Mapping anciens dossiers → nouveaux noms
const CATEGORY_RENAME = {
  documents: 'Documents',
  images: 'Images',
  videos: 'Videos',
  others: 'Autres',
};

const DEFAULT_FOLDERS = ['Documents', 'Images', 'Videos', 'Autres'];

async function connectDB() {
  const uri = process.env.MONGO_URI || process.env.DB_HOST || 'mongodb://geid-mongo:27017/geid';
  await mongoose.connect(uri);
  console.log('[migration] MongoDB connecté');
}

/**
 * Scanne récursivement un répertoire et retourne tous les fichiers/dossiers
 */
function scanDir(dir) {
  const entries = [];
  if (!fs.existsSync(dir)) return entries;
  for (const name of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, name);
    try {
      const stat = fs.statSync(fullPath);
      entries.push({ name, fullPath, isDirectory: stat.isDirectory(), size: stat.size, mtime: stat.mtime, mimetype: '' });
      if (stat.isDirectory()) {
        entries.push(...scanDir(fullPath).map(e => e));
      }
    } catch { /* skip */ }
  }
  return entries;
}

async function migrateUser(userId) {
  const userDir = path.join(WORKSPACE_DIR, userId);
  if (!fs.existsSync(userDir)) return;

  console.log(`[migration] Traitement de l'utilisateur: ${userId}`);
  let filesCreated = 0;
  let filesUploaded = 0;
  let foldersCreated = 0;

  // Parcourir les anciens dossiers catégorie
  for (const [oldCat, newName] of Object.entries(CATEGORY_RENAME)) {
    const catDir = path.join(userDir, oldCat);
    if (!fs.existsSync(catDir)) continue;

    // Le path MongoDB pour les fichiers dans l'ancien dossier catégorie
    // était "{category}" (ex: "documents"). On les migre vers le nouveau nom.
    // Nouveau path: "" (racine) pour le dossier lui-même, "{newName}" pour son contenu

    await processDirectory(userId, catDir, newName, '');
    filesUploaded++;
  }

  // Traiter aussi les dossiers hors catégorie (racine user)
  for (const entry of fs.readdirSync(userDir)) {
    if (Object.keys(CATEGORY_RENAME).includes(entry)) continue; // Skip old categories
    const fullPath = path.join(userDir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      await processDirectory(userId, fullPath, entry, '');
    } else {
      await ensureFileRecord(userId, '', entry, fullPath, stat);
    }
  }

  // Créer les 4 dossiers par défaut s'ils n'existent pas
  for (const folderName of DEFAULT_FOLDERS) {
    const exists = await WorkspaceFile.findOne({
      owner: userId,
      path: '',
      name: folderName,
      isDirectory: true,
    });
    if (!exists) {
      await new WorkspaceFile({
        name: folderName,
        owner: userId,
        path: '',
        isDirectory: true,
      }).save();
      foldersCreated++;
      console.log(`  [+] Dossier par défaut créé: ${folderName}`);
    }
  }

  console.log(`  [✓] ${userId}: ${filesCreated} fichiers, ${foldersCreated} dossiers créés`);
}

async function processDirectory(userId, dirPath, dirName, parentPath) {
  // Créer le dossier dans MongoDB s'il n'existe pas
  const existingFolder = await WorkspaceFile.findOne({
    owner: userId,
    path: parentPath,
    name: dirName,
    isDirectory: true,
  });
  if (!existingFolder) {
    await new WorkspaceFile({
      name: dirName,
      owner: userId,
      path: parentPath,
      isDirectory: true,
    }).save();
    console.log(`  [+] Dossier: ${parentPath ? parentPath + '/' : ''}${dirName}`);
  }

  const childPath = parentPath ? `${parentPath}/${dirName}` : dirName;

  // Traiter le contenu
  if (!fs.existsSync(dirPath)) return;
  for (const entry of fs.readdirSync(dirPath)) {
    const fullPath = path.join(dirPath, entry);
    let stat;
    try { stat = fs.statSync(fullPath); } catch { continue; }

    if (stat.isDirectory()) {
      await processDirectory(userId, fullPath, entry, childPath);
    } else {
      await ensureFileRecord(userId, childPath, entry, fullPath, stat);
    }
  }
}

async function ensureFileRecord(userId, wsPath, fileName, fullPath, stat) {
  // Skip system files
  if (fileName.startsWith('.') || ['Thumbs.db', 'thumbs.db', '.gitkeep', '.DS_Store'].includes(fileName)) return;

  // Vérifier si l'entrée existe déjà
  const existing = await WorkspaceFile.findOne({
    owner: userId,
    path: wsPath,
    name: fileName,
    isDirectory: false,
  });

  const parts = ['workspace', userId, wsPath, fileName].filter(Boolean);
  const relativePath = parts.join('/');

  if (!existing) {
    const ext = path.extname(fileName).slice(1);
    const mime = require('mime-types');
    await new WorkspaceFile({
      name: fileName,
      owner: userId,
      path: wsPath,
      isDirectory: false,
      format: ext,
      size: stat.size,
      mimeType: mime.lookup(fileName) || 'application/octet-stream',
      contentUrl: relativePath,
    }).save();
    console.log(`  [+] Fichier: ${wsPath ? wsPath + '/' : ''}${fileName}`);
  }

  // Upload vers MinIO si pas déjà présent
  try {
    const existsInMinio = await storage.fileExists(relativePath);
    if (!existsInMinio) {
      await storage.uploadFileFromDisk(relativePath, fullPath);
      console.log(`  [↑] MinIO: ${relativePath}`);
    }
  } catch (err) {
    console.error(`  [!] MinIO error: ${relativePath}:`, err.message);
  }
}

async function main() {
  await connectDB();

  if (!fs.existsSync(WORKSPACE_DIR)) {
    console.log('[migration] Pas de dossier workspace/ trouvé');
    process.exit(0);
  }

  const userDirs = fs.readdirSync(WORKSPACE_DIR).filter(f => {
    try { return fs.statSync(path.join(WORKSPACE_DIR, f)).isDirectory(); }
    catch { return false; }
  });

  console.log(`[migration] ${userDirs.length} utilisateurs trouvés`);

  for (const userId of userDirs) {
    await migrateUser(userId);
  }

  // Supprimer les anciens WorkspaceFile qui avaient un path de type "documents", "images", etc.
  // et les re-pointer vers les nouveaux noms
  for (const [oldCat, newName] of Object.entries(CATEGORY_RENAME)) {
    const count = await WorkspaceFile.countDocuments({ path: oldCat });
    if (count > 0) {
      await WorkspaceFile.updateMany({ path: oldCat }, { path: newName });
      console.log(`[migration] ${count} entrées migrées de path="${oldCat}" vers path="${newName}"`);
    }
    // Aussi les sous-chemins: "documents/subfolder" → "Documents/subfolder"
    const cursor = await WorkspaceFile.find({ path: { $regex: `^${oldCat}/` } });
    for (const doc of cursor) {
      const newPath = newName + doc.path.slice(oldCat.length);
      await WorkspaceFile.findByIdAndUpdate(doc._id, { path: newPath });
    }
  }

  console.log('[migration] ✓ Migration terminée');
  process.exit(0);
}

main().catch(err => {
  console.error('[migration] Erreur fatale:', err);
  process.exit(1);
});

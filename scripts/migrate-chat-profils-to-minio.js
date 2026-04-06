#!/usr/bin/env node
/**
 * Migration script: salon/ + profils/ + ressources/ → MinIO
 *
 * Scanne les dossiers salon/, profils/, ressources/ sur le filesystem
 * et upload chaque fichier vers le bucket MinIO correspondant.
 *
 * Usage: node scripts/migrate-chat-profils-to-minio.js
 * (Exécuter depuis le répertoire GEID_Git)
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const storage = require('../tools/storage');

const DIRS_TO_MIGRATE = ['salon', 'profils', 'ressources'];

function scanDir(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  for (const name of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, name);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        files.push(...scanDir(fullPath));
      } else if (stat.isFile()) {
        files.push(fullPath);
      }
    } catch (err) {
      console.warn('[scan] skip:', fullPath, err.message);
    }
  }
  return files;
}

async function migrateDir(dirName) {
  const baseDir = path.resolve(dirName);
  const files = scanDir(baseDir);
  console.log(`[${dirName}] ${files.length} fichiers trouvés`);

  let uploaded = 0;
  let skipped = 0;
  let errors = 0;

  for (const fullPath of files) {
    const relativePath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
    try {
      const exists = await storage.fileExists(relativePath);
      if (exists) {
        skipped++;
        continue;
      }
      const buffer = fs.readFileSync(fullPath);
      await storage.uploadFile(relativePath, buffer);
      uploaded++;
      if (uploaded % 50 === 0) {
        console.log(`[${dirName}] ${uploaded} uploadés, ${skipped} déjà présents...`);
      }
    } catch (err) {
      errors++;
      console.error(`[${dirName}] erreur:`, relativePath, err.message);
    }
  }

  console.log(`[${dirName}] Terminé: ${uploaded} uploadés, ${skipped} déjà présents, ${errors} erreurs`);
}

async function main() {
  if (!storage.MINIO_ENABLED) {
    console.error('MINIO_ENDPOINT non défini — migration impossible.');
    process.exit(1);
  }

  console.log('=== Migration salon/ + profils/ + ressources/ → MinIO ===\n');

  for (const dir of DIRS_TO_MIGRATE) {
    await migrateDir(dir);
    console.log();
  }

  console.log('=== Migration terminée ===');
  process.exit(0);
}

main().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});

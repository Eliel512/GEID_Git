const fs = require('fs');
const paths = require('path');
const Doc = require('../../models/archives/doc.model');
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const getHost = require('../getHost').getHost();
const { WORKSPACE_BASE, safePath } = require('./utils');

exports.getAll = (req, res) => {
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
  try {
    fs.mkdirSync(targetDir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      return res.status(500).json({ message: 'Une erreur est survenue' });
    }
  }
  fs.readdir(targetDir, async (err, files) => {
    if (err) {
      return res.status(500).json({ message: 'Une erreur est survenue' });
    }
    const result = [];
    for (const file of files) {
      let stat;
      try {
        stat = fs.statSync(paths.join(targetDir, file));
      } catch {
        continue;
      }
      const isDirectory = stat.isDirectory();
      const url = isDirectory ? null : `https://${getHost}/workspace/${userId}/${subPath}/${file}`;
      const doc = isDirectory ? null : await Doc.findOne({
        owner: userId,
        contentUrl: paths.join('workspace', userId, subPath, file)
      });

      // Update lastAccessedAt in WorkspaceFile if it exists
      if (!isDirectory) {
        WorkspaceFile.findOneAndUpdate(
          { owner: userId, path: subPath, name: file },
          { lastAccessedAt: new Date() },
          { upsert: false }
        ).catch(() => {});
      }

      result.push({
        name: file,
        url,
        createdAt: stat.mtime,
        size: stat.size,
        isDirectory,
        doc,
      });
    }
    result.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    res.status(200).json(result);
  });
};

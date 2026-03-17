const Doc = require('../models/archives/doc.model');
const getHost = require('./getHost').getHost();
const fs = require('fs');
const mime = require('mime-types');
const paths = require('path');
const docEvent = require('../events/doc');

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
  const filename = req.body.filename + '.' + extension/*.split(' ').join('_') + '.' */;
  const { path } = req.body;
  fs.access(`./workspace/${userId}/${path}/${filename}`, err => {
    if(err){
      console.log(err);
      res.status(500).json({ message: 'Erreur interne du serveur' });
    }else{
      const doc = new Doc({
        ...req.body,
        format: extension,
        owner: userId,
        contentUrl: paths.join('workspace', userId, path, filename)
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
                let mtime;
                try {
                  mtime = fs.statSync(`./workspace/${userId}/${path}/${file}`).mtime;
                } catch (error) {
                  console.log(error);
                  return res.status(500).json({ message: 'Une erreur est survenue' });
                }
                result.push({
                  'name': file,
                  'url': `https://${getHost}/workspace/${userId}/${path}/${file}`,
                  'createdAt': mtime,
                  'doc': {
                    ...doc._doc
                  }
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

/*exports.getOne = (req, res, next) => {
  
};*/

exports.modify = (req, res, next) => {
  const userId = res.locals.userId;
  const extension = path.extname(req.body.oldFilename);
  const filename = req.body.filename.split(' ').join('_') + extension;
  const { path } = req.body;
  fs.rename(`./workspace/${userId}/${path}/${req.body.oldFilename}`,
  `./workspace/${req.body.userId}/${req.body.path}/${filename}`,
   err => {
    if(err){
      console.log(err);
      res.status(500).json({ message: 'Erreur interne du serveur' });
    }else{
      const result = [];
      fs.readdir(`./workspace/${userId}/${path}`, (err, files) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ message: 'Une erreur est survenue' });
        } else {
          for (let file of files) {
            let mtime;
            try {
              mtime = fs.statSync(`./workspace/${userId}/${path}/${file}`).mtime;
            } catch (error) {
              console.log(error);
              return res.status(500).json({ message: 'Une erreur est survenue' });
            }
            result.push({
              'name': file,
              'url': `https://${getHost}/workspace/${userId}/${path}/${file}`,
              'createdAt': mtime
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
      const result = [];
      fs.readdir(targetDir, (err, files) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ message: 'Une erreur est survenue' });
        } else {
          for (let file of files) {
            let mtime;
            try {
              mtime = fs.statSync(paths.join(targetDir, file)).mtime;
            } catch (error) {
              console.log(error);
              return res.status(500).json({ message: 'Une erreur est survenue' });
            }
            result.push({
              'name': file,
              'url': `https://${getHost}/workspace/${userId}/${subPath}/${file}`,
              'createdAt': mtime
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
        let mtime;
        try {
          mtime = fs.statSync(paths.join(targetDir, file)).mtime;
        } catch (error) {
          console.log(error);
          return res.status(500).json({ message: 'Une erreur est survenue' });
        }
        const url = `https://${getHost}/workspace/${userId}/${subPath}/${file}`;
        // Utilise une comparaison exacte sur contentUrl plutôt qu'un $regex
        const doc = await Doc.findOne({ owner: userId, contentUrl: paths.join('workspace', userId, subPath, file) });
        result.push({
          'name': file,
          'url': url,
          'createdAt': mtime,
          'doc': doc
        });
      }
      res.status(200).json(result);
    }
  });
};

/*exports.deleteAll = (req, res, next) => {
  
};*/

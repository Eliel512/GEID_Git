const multer = require('multer');
const path = require('path');
const minioStorage = require('../tools/storage');

const RESSOURCES_BASE = path.resolve('ressources');

const diskStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    const userInput = (req.body.path || '').replace(/\.\./g, '');
    const dest = path.resolve(RESSOURCES_BASE, userInput);
    if (!dest.startsWith(RESSOURCES_BASE + path.sep) && dest !== RESSOURCES_BASE) {
      return callback(new Error('Chemin non autorisé'));
    }
    callback(null, dest);
  },
  filename: (req, file, callback) => {
    const name = file.originalname/*.split(' ').join('_')*/;
    //const extension = MIME_TYPES[file.mimetype];
    /* + '.' + extension*/
    callback(null, name);
  }
});

const upload = multer({storage: diskStorage}).single('file');

// Wrap multer to also upload to MinIO after disk write
module.exports = (req, res, next) => {
    upload(req, res, (err) => {
        if (err) return next(err);
        if (req.file) {
            // Build relative path: ressources/<subpath>/<filename>
            const userInput = (req.body.path || '').replace(/\.\./g, '');
            const relPath = path.join('ressources', userInput, req.file.filename);
            minioStorage.uploadFileFromDisk(relPath, req.file.path).catch(err2 => {
                console.error('[MinIO upload] multer-config:', err2.message);
            });
        }
        next();
    });
};

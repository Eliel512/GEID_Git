const multer = require('multer');
const minioStorage = require('../tools/storage');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/webp': 'webp'
};



const diskStorage = multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, 'profils/');
    },
    filename: (req, file, callback) => {
      const name = `${req.userId}`;
      const extension = MIME_TYPES[file.mimetype];
      if(!extension){
        next(new Error('Extension de fichier incorrecte'));
      }
      callback(null, name + '.' + extension);
    }
});

const upload = multer({storage: diskStorage}).single('file');

// Wrap multer to also upload to MinIO after disk write
module.exports = (req, res, next) => {
    upload(req, res, (err) => {
        if (err) return next(err);
        if (req.file) {
            const relPath = `profils/${req.file.filename}`;
            minioStorage.uploadFileFromDisk(relPath, req.file.path).catch(err2 => {
                console.error('[MinIO upload] addProfil:', err2.message);
            });
        }
        next();
    });
};

const multer = require('multer');
const fs = require('fs');
const mime = require('mime-types');
const pathModule = require('path');
const minioStorage = require('../tools/storage');

const diskStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    const path = "workspace/"+req.body.userId+"/"+req.body.path;
    fs.mkdirSync(path, { recursive: true });
    callback(null, path);
  },
  filename: (req, file, callback) => {
    const name = req.body.filename/*.split(' ').join('_')*/;
    const extension = mime.extension(file.mimetype);
    if(!extension){
      throw 'Invalid file type';
    }
    /* + '.' + extension*/
    callback(null, name + '.' + extension);
  }
});

const upload = multer({storage: diskStorage}).single('file');

// Wrap multer to also upload to MinIO after disk write
module.exports = (req, res, next) => {
    upload(req, res, (err) => {
        if (err) return next(err);
        if (req.file) {
            const relPath = pathModule.join(req.file.destination, req.file.filename);
            minioStorage.uploadFileFromDisk(relPath, req.file.path).catch(err2 => {
                console.error('[MinIO upload] multer-work:', err2.message);
            });
        }
        next();
    });
};

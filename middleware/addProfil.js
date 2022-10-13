const multer = require('multer');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/webp': 'webp'
};



const storage = multer.diskStorage({
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

module.exports = multer({storage: storage}).single('file');
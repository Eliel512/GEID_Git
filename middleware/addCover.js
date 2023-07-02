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
      callback(null, `ressources/covers/`);
    },
    filename: (req, file, callback) => {
      const name = req.body.name/*.split(' ').join('_')*/;
      const extension = MIME_TYPES[file.mimetype];
      callback(null, name + '.' + extension);
    }
  });
  
  module.exports = multer({storage: storage}).single('file');

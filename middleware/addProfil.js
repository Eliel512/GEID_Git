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
      callback(null, '../profils/');
    },
    filename: (req, file, callback) => {
      const name = `profil_${req.body.userId}`;
      const extension = MIME_TYPES[file.mimetype];
      callback(null, name + Date.now() + '.' + extension);
    }
  });
  
  module.exports = multer({storage: storage}).single('profil');
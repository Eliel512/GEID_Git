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
      callback(null, `ressources/covers/${req.body.path}`);
    },
    filename: (req, file, callback) => {
      const name = `cover_${req.body.contentId}`;
      const extension = MIME_TYPES[file.mimetype];
      callback(null, name + '.' + extension);
    }
  });
  
  module.exports = multer({storage: storage}).single('file');
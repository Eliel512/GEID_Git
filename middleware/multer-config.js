const multer = require('multer');
const path = require('path');

const RESSOURCES_BASE = path.resolve('ressources');

const storage = multer.diskStorage({
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

module.exports = multer({storage: storage}).single('file');
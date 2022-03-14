const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    //const link = req.method === "PUT" ?
      /*JSON.parse(req.body.path.split('=')[1]).path : req.body.path.split('=')[1];*/
    const path = "ressources/"+req.body.path;
    callback(null, path);
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split(' ').join('_');
    //const extension = MIME_TYPES[file.mimetype];
    /* + '.' + extension*/
    callback(null, name);
  }
});

module.exports = multer({storage: storage}).single('file');
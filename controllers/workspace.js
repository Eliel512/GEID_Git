const getHost = require('./getHost').getHost();
const fs = require('fs');
const mime = require('mime-types');
const path = require('path');

exports.create = (req, res, next) => {
  const extension = mime.extension(req.file.mimetype);
  const filename = req.body.filename.split(' ').join('_') + '.' + extension;
  fs.access(`./workspace/${req.body.userId}/${req.body.path}/${filename}`, err => {
    if(err){
      console.log(err);
      res.status(500).json({ message: 'Erreur interne du serveur' });
    }else{
      res.status(201).json({ message: "Fichier créé avec succès !" });
    }
  })
};

/*exports.getOne = (req, res, next) => {
  
};*/

exports.modify = (req, res, next) => {
  const extension = path.extname(req.body.oldFilename);
  const filename = req.body.filename.split(' ').join('_') + extension;
  fs.rename(`./workspace/${req.body.userId}/${req.body.path}/${req.body.oldFilename}`,
  `./workspace/${req.body.userId}/${req.body.path}/${filename}`,
   err => {
    if(err){
      console.log(err);
      res.status(500).json({ message: 'Erreur interne du serveur' });
    }else{
      res.status(201).json({ message: "Fichier modifié avec succès !" });
    }
  })
};

exports.delete = (req, res, next) => {
  const userId = JSON.parse(req.params.data)["userId"];
  const path = JSON.parse(req.params.data)["path"];
  const filename = JSON.parse(req.params.data)["filename"];

  fs.unlink(`./workspace/${userId}/${path}/${filename}`, err => {
    if(err){
      console.log(err);
      res.status(500).json({ err });
    }else{
      res.status(201).json({ message: "Fichier supprimé avec succès !" });
    }
  })
};

exports.getAll = (req, res, next) => {
  const userId = JSON.parse(req.params.data)["userId"];
  const path = JSON.parse(req.params.data)["path"];
  let result = [];
  fs.readdir(`./workspace/${userId}/${path}`, (err, files) => {
    if(err){
      console.log(err);
      return res.status(500).json({ err });
    }else{
      for(file of files){
        result.push({
          'name': file,
          'url': `${req.protocol}://${getHost}/workspace/${userId}/${path}/${file}`
        });
      }
      res.status(200).json(result);
    }
  });
};

/*exports.deleteAll = (req, res, next) => {
  
};*/
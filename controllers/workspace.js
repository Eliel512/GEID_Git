const getHost = require('./getHost').getHost();
const fs = require('fs');
const mime = require('mime-types');
const path = require('path');

exports.create = (req, res, next) => {
  const userId = res.locals.userId;
  const extension = mime.extension(req.file.mimetype);
  const filename = req.body.filename.split(' ').join('_') + '.' + extension;
  const { path } = req.body;
  fs.access(`./workspace/${userId}/${path}/${filename}`, err => {
    if(err){
      console.log(err);
      res.status(500).json({ message: 'Erreur interne du serveur' });
    }else{
      const result = [];
      fs.readdir(`./workspace/${userId}/${path}`, (err, files) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ message: 'Une erreur est survenue' });
        } else {
          for (let file of files) {
            let mtime;
            try {
              mtime = fs.statSync(`./workspace/${userId}/${path}/${file}`).mtime;
            } catch (error) {
              console.log(error);
              return res.status(500).json({ message: 'Une erreur est survenue' });
            }
            result.push({
              'name': file,
              'url': `https://${getHost}/workspace/${userId}/${path}/${file}`,
              'createdAt': mtime
            });
          }
          res.status(201).json(result);
        }
      });
    }
  })
};

/*exports.getOne = (req, res, next) => {
  
};*/

exports.modify = (req, res, next) => {
  const userId = res.locals.userId;
  const extension = path.extname(req.body.oldFilename);
  const filename = req.body.filename.split(' ').join('_') + extension;
  const { path } = req.body;
  fs.rename(`./workspace/${userId}/${path}/${req.body.oldFilename}`,
  `./workspace/${req.body.userId}/${req.body.path}/${filename}`,
   err => {
    if(err){
      console.log(err);
      res.status(500).json({ message: 'Erreur interne du serveur' });
    }else{
      const result = [];
      fs.readdir(`./workspace/${userId}/${path}`, (err, files) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ message: 'Une erreur est survenue' });
        } else {
          for (let file of files) {
            let mtime;
            try {
              mtime = fs.statSync(`./workspace/${userId}/${path}/${file}`).mtime;
            } catch (error) {
              console.log(error);
              return res.status(500).json({ message: 'Une erreur est survenue' });
            }
            result.push({
              'name': file,
              'url': `https://${getHost}/workspace/${userId}/${path}/${file}`,
              'createdAt': mtime
            });
          }
          res.status(200).json(result);
        }
      });
    }
  })
};

exports.delete = (req, res, next) => {
  const userId = res.locals.userId;
  const path = JSON.parse(req.params.data)["path"];
  const filename = JSON.parse(req.params.data)["filename"];

  fs.unlink(`./workspace/${userId}/${path}/${filename}`, err => {
    if(err){
      console.log(err);
      res.status(500).json({ err });
    }else{
      const result = [];
      fs.readdir(`./workspace/${userId}/${path}`, (err, files) => {
        if (err) {
          console.log(err);
          return res.status(500).json({ message: 'Une erreur est survenue' });
        } else {
          for (let file of files) {
            let mtime;
            try {
              mtime = fs.statSync(`./workspace/${userId}/${path}/${file}`).mtime;
            } catch (error) {
              console.log(error);
              return res.status(500).json({ message: 'Une erreur est survenue' });
            }
            result.push({
              'name': file,
              'url': `https://${getHost}/workspace/${userId}/${path}/${file}`,
              'createdAt': mtime
            });
          }
          res.status(200).json(result);
        }
      });
    }
  })
};

exports.getAll = (req, res, next) => {
  const userId = res.locals.userId;
  const path = JSON.parse(req.params.data)["path"];
  let result = [];
  try {
    fs.mkdirSync(`./workspace/${userId}/${path}`, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.log(err);
      return res.status(500).json({ message: 'Une erreur est survenue' });
    }
  }
  fs.readdir(`./workspace/${userId}/${path}`, (err, files) => {
    if(err){
      console.log(err);
      return res.status(500).json({ message: 'Une erreur est survenue' });
    }else{
      for(let file of files){
        let mtime;
        try {
          mtime = fs.statSync(`./workspace/${userId}/${path}/${file}`).mtime;
        } catch (error) {
          console.log(error);
          return res.status(500).json({ message: 'Une erreur est survenue' });      
        } 
        result.push({
          'name': file,
          'url': `https://${getHost}/workspace/${userId}/${path}/${file}`,
          'createdAt': mtime
        });
      }
      res.status(200).json(result);
    }
  });
};

/*exports.deleteAll = (req, res, next) => {
  
};*/

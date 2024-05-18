const Doc = require('../models/archives/doc.model');
const getHost = require('./getHost').getHost();
const fs = require('fs');
const mime = require('mime-types');
const paths = require('path');
const docEvent = require('../events/doc');

exports.create = (req, res, next) => {
  const userId = res.locals.userId;
  const extension = mime.extension(req.file.mimetype);
  const filename = req.body.filename + '.' + extension/*.split(' ').join('_') + '.' */;
  const { path } = req.body;
  fs.access(`./workspace/${userId}/${path}/${filename}`, err => {
    if(err){
      console.log(err);
      res.status(500).json({ message: 'Erreur interne du serveur' });
    }else{
      const doc = new Doc({
        ...req.body,
        format: extension,
        owner: userId,
        contentUrl: paths.join('workspace', userId, path, filename)
      });
      doc.save()
        .then(() => {
          docEvent.emit('create', {
            _id: doc._id,
            format: doc.format,
            contentUrl: doc.contentUrl,
            author: userId
          });
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
                  'createdAt': mtime,
                  'doc': {
                    ...doc._doc
                  }
                });
              }
              res.status(201).json(result);
            }
          });
        })
        .catch(error => {
          console.log(error);
          res.status(500).json({ message: 'Une erreur est survenue' });
        })
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
  fs.readdir(`./workspace/${userId}/${path}`, async (err, files) => {
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
        const url = `https://${getHost}/workspace/${userId}/${path}/${file}`;
        const urlFilter = url.split('workspace')[1];
        const doc = await Doc.findOne({ owner: userId, contentUrl: { $regex:  urlFilter } });
        result.push({
          'name': file,
          'url': url,
          'createdAt': mtime,
          'doc': doc
        });
      }
      res.status(200).json(result);
    }
  });
};

/*exports.deleteAll = (req, res, next) => {
  
};*/

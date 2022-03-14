const Ressource = require('../models/ressource');
const fs = require('fs');
const fsPromises = fs.promises;

exports.create = (req, res, next) => {
  const ressourceObject = JSON.parse(req.body.ressource);
  delete ressourceObject._id;

  const ressource = new Ressource({
    ...ressourceObject,
    contentUrl: `${req.protocol}://${req.get('host')}/workspace/${req.body.userId}/${req.body.path}/${req.file.filename}`
  });
  fsPromises.access(`../workspace/${req.body.userId}/${req.body.path}/${req.file.filename}`)
    .then(() => {
      essource.save()
        .then(() => res.status(200).json(ressource))
        .catch();
    })
    .catch(error => res.status(401).json({ error }));
};

exports.getOne = (req, res, next) => {
  Ressource.findOne({
    _id: req.params.id
  })
  .then(ressource => res.status(200).json(ressource))
  .catch(error => res.status(404).json({error: error}));
};

exports.download = (req, res, next) => {
  Ressource.findOne({
    _id: req.params.id
  })
  .then(() => res.status(200).download(`../workspace/${req.body.userId}/${req.params.path}`))
  .catch(error => res.status(404).json({error: error}));
};

exports.modify = (req, res, next) => {
  const ressourceObject = req.file ?
  {
    ...JSON.parse(req.body.ressource),
    contentUrl: `${req.protocol}://${req.get('host')}/workspace/${req.body.userId}/${req.file.filename}`
  } : { ...req.body };
  Ressource.updateOne({ _id: req.params.id }, { ...ressourceObject, _id: req.params.id })
    .then(() => res.status(200).json({ message: 'Objet modifié !' }))
    .catch(error => res.status(400).json({ error })); 
};

exports.delete = (req, res, next) => {
  Ressource.findOne({ _id: req.params.id })
    .then(ressource => {
      const filename = ressource.contentUrl.split(`/workspace/${req.body.userId}/`)[1];
      fs.unlink(`workspace/${req.body.userId}/${filename}`, () => {
        Ressource.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Objet supprimé !'}))
          .catch(error => res.status(400).json({ error }));
      });
    })
    .catch(error => res.status(500).json({ error }));
};

exports.getAll = (req, res, next) => {
  Ressource.find({ userId: req.params.userId })
    .then(ressources => res.status(200).json(ressources))
    .catch(error => res.status(400).json({error: error}));
};
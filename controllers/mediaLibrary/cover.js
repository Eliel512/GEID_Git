const fs = require('fs');
const Cover = require('../../models/mediaLibrary/cover.model');
const Type = require('../../models/archives/type.model');
const Book = require('../../models/mediaLibrary/book.model');
//const Ressource = require('../models/ressource');
const getHost = require('./getHost').getHost();

module.exports = {
  getAll: (req, res, next) => {
    Cover.find({  })
      .then(covers => res.status(200).json(covers))
      .catch(() => res.status(500).json({ message: 'Une erreur est survenue!'  }));
  },
  addOne: async (req, res, next) => {
    let { name, docTypes } = req.body;
    docTypes = JSON.parse(docTypes).map(doc => doc.toUpperCase());
    const types = await Type.find({  }, { name:1, subtypes:1, _id:0 });
    const doctypes = types.map(doc => [doc.name, ...doc.subtypes]).flat();
    console.log(doctypes);
    const cover = new Cover({
      name: name.toUpperCase(),
      docTypes: docTypes.filter(doc => doctypes.includes(doc)),
      contentUrl: `https://${getHost}/ressources/covers/${req.file.filename}`
    });
    cover.save()
      .then(() => res.status(201).json({ message: 'Couverture ajoutée avec succès!' }))
      .catch(err => {
        console.log(err);
        res.status(400).json({ message: 'Impossible d\'enregistrer la couverture, veuillez vérifier vos entrées' });
      });
  },
  deleteOne: async (req, res, next) => {
  Cover.findOne({ name: req.params.name })
    .then(cover => {
      fs.unlink(`./ressources/${cover.contentUrl.split('ressources/')[1]}`, err => {
        if(err){
          console.log(err);
          res.status(500).json({ message: 'Erreur interne du serveur!' });
        }else{
          Cover.deleteOne({ name: req.params.name  })
          .then(res.status(200).json({ message: 'Couverture supprimée avec succès!' }))
          .catch(err => {
            console.log(err);
            res.status(500).json({ message: 'Une erreur est survenue!' });
          });
        }
      });
    })
    .catch(error => res.status(400).json({ message: 'Une erreur est survenue!' }));
  },
  setCover: async (req, res, next) => {
    let coverUrl;
    Cover.findOne({ name: req.body.name  })
      .then(cover => coverUrl = cover.contentUrl)
      .catch(res.status(400).json({ message: 'Nom de couverture incorrect!'  }));
    switch(req.body['for']){
      case 'book':
        Book.updateOne({ _id: req.body.docId },
         { $set: { coverUrl: coverUrl } })
          .then(() => res.status(200).json({ message: 'Couverture configurée avec succès!' }))
          .catch(error => {
            console.log(error);
            res.status(400).json({ error: error.toString() });
    });
      break;
      case 'archive':
        Ressource.updateOne({ _id: req.body.docId },
         { $set: { coverUrl: coverUrl } })
          .then(() => res.status(200).json({ message: 'Couverture configurée avec succès!' }))
          .catch(error => {
            console.log(error);
            res.status(400).json({ error: error.toString() });
    });
      break;
    }
  }
};

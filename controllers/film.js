const { Film } = require('../models/film');
const { filmFrozen } = require('../models/frozen');
const getHost = require('./getHost').getHost();
const fs = require('fs');
const User = require('../models/user');

exports.create = (req, res, next) => {
  const { userId, frozenId } = req.body;
  User.findOne({ _id: userId })
    .then(user => {
      if(user.grade["permission"].find(el => el === 'filmotheque')){
        filmFrozen.findOneAndDelete({ _id: frozenId },{
          projection:{
            sendedAt:0, _id:0, __v:0, createdBy:0
          }
        })
          .then(frozen => {
            const fileUrl = '.' + frozen._doc.fileUrl.split(`${getHost}`)[1];
            const contentUrl = '.' + frozen._doc["contentUrl"].split(`${getHost}`)[1];
            const filmObject = {
              ...frozen._doc
            };
            delete filmObject.fileUrl;
            const film = new Film({
              ...filmObject
            });
            Film.findOne({ contentUrl: film.contentUrl })
              .then(fiilm => {
                fiilm ?
                  res.status(400)
                  .json({
                     message: 'Le fichier envoyé est déjà enregistré sur le serveur.'
                    }) : film.save()
                          .then(() => {
                            fs.link(fileUrl,
                              contentUrl,
                              err => {
                                if(err){
                                    console.log(err);
                                    return res.status(500).json({ message: 'Erreur interne du serveur' });
                                }else{
                                  res.status(201).json({ message: 'Vidéo enregistrée !' });
                                }
                              });
                          })
                          .catch(error => res.status(400).json({ error }));
              })
              .catch(error => res.status(500).json({ error }));
          })
          .catch(error => {
            console.log(error);
            res.status(400).json({ error })
          });
      }else{
        return res.status(401).json({ message: 'Non authorisé' });
      }
    })
    .catch(error => {
      console.log(error);
      res.status(400).json({ error })
    });
};

exports.getOne = (req, res, next) => {
  Film.findOne({
    _id: req.params.id.split('=')[1]
  }).then(
    (film) => {
      res.status(200).json(film);
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error: error
      });
    }
  );
};

exports.modify = (req, res, next) => {
  const filmData = JSON.parse(req.body.film);
  const filmObject = req.file ?
  {
    ...filmData,
    contentUrl: `${req.protocol}://${getHost}/ressources/mediatheque/filmotheque/${req.file.filename}`
  } : { ...filmData };
  const filmId = JSON.parse(req.params.path.split('=')[1])["id"];
  Film.findOneAndUpdate({ _id: filmId }, { ...filmObject, _id: filmId })
    .then(film => {
      if(!req.file){
        res.status(200).json({ message: 'Vidéo modifié !'});
      }else{
        const filename = film.contentUrl.split('/ressources/mediatheque/filmotheque/')[1];
        fs.unlink(`ressources/mediatheque/filmotheque/${filename}`, () => {
          res.status(200).json({ message: 'Vidéo modifié !'})
        });
      }

    })
    .catch(error => res.status(400).json({ error })); 
};

exports.delete = (req, res, next) => {
  Film.findOne({ _id: req.params.id.split('=')[1] })
    .then(film => {
      const filename = film.contentUrl.split('/ressources/mediatheque/filmotheque/')[1];
      fs.unlink(`ressources/mediatheque/filmotheque/${filename}`, () => {
        film.deleteOne({ _id: req.params.id.split('=')[1] })
          .then(() => res.status(200).json({ message: 'Vidéo supprimé !'}))
          .catch(error => res.status(400).json({ error }));
      });
    })
    .catch(error => res.status(500).json({ error }));
};

exports.getAll = (req, res, next) => {
  Film.find().then(
    (films) => {
      res.status(200).json(films);
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};


exports.deleteAll = (req, res, next) => {
  Film.find({  })
    .then(films => {
      films ? (() => {
        for(const film of films){
            const filename = film.contentUrl.split('/ressources/mediatheque/filmotheque/')[1];
            fs.unlink(`ressources/mediatheque/filmotheque/${filename}`, () => {
            });
        }
        Film.deleteMany({  })
              .then(count => res.status(200).json({ message: `${count.deletedCount} données supprimées !`}))
              .catch(error => res.status(400).json({ error }));
      })() : res.status(200).json({ message: 'Vide.'});
    })
    .catch(error => res.status(500).json({ error }));
};
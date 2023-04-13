const { Image } = require('../../models/mediaLibrary/image.model');
const { imageFrozen } = require('../../models/mediaLibrary/frozen.model');
const getHost = require('./getHost').getHost();
const fs = require('fs');
const User = require('../../models/users/user.model');

exports.create = (req, res, next) => {
  const { userId, frozenId } = req.body;
  User.findOne({ _id: userId })
    .then(user => {
      if (user.auth['readNWrite'].includes('images')){
        imageFrozen.findOneAndDelete({ _id: frozenId },{
          projection:{
            sendedAt:0, _id:0, __v:0, createdBy:0
          }
        })
          .then(frozen => {
            const fileUrl = '.' + frozen._doc.fileUrl;
            const contentUrl = '.' + frozen._doc["contentUrl"];
            const imageObject = {
              ...frozen._doc
            };
            delete imageObject.fileUrl;
            const image = new Image({
              ...imageObject
            });
            Image.findOne({ contentUrl: image.contentUrl })
              .then(img => {
                img ?
                  res.status(400)
                  .json({
                     message: 'Le fichier envoyé est déjà enregistré sur le serveur.'
                    }) : image.save()
                          .then(() => {
                            fs.copyFile(fileUrl,
                              contentUrl,
                              err => {
                                if(err){
                                    console.log(err);
                                    return res.status(500).json({ message: 'Erreur interne du serveur' });
                                }else{
                                  res.status(201).json({ message: 'Image enregistrée !' });
                                }
                              });
                          })
                          .catch(error => res.status(400).json({ error }));
              })
              .catch(error => {
                console.log(error);
                res.status(500).json({ error })
              });
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
  Image.findOne({
    _id: req.params.id.split('=')[1]
  }).then(
    (image) => {
      res.status(200).json(image);
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
  const imageObject = req.file ?
  {
    ...req.body.image,
    contentUrl: `${req.protocol}://${getHost}/ressources/mediatheque/phototheque/${req.file.filename}`
  } : { ...req.body };
  Image.updateOne({ _id: req.params.id.split('=')[1] }, { ...imageObject, _id: req.params.id.split('=')[1] })
    .then(() => res.status(200).json({ message: 'Livre modifié !' }))
    .catch(error => res.status(400).json({ error })); 
};

exports.delete = (req, res, next) => {
  Image.findOne({ _id: req.params.id.split('=')[1] })
    .then(image => {
      const filename = image.contentUrl.split('/ressources/mediatheque/phototheque/')[1];
      fs.unlink(`ressources/mediatheque/phototheque/${filename}`, () => {
        Image.deleteOne({ _id: req.params.id.split('=')[1] })
          .then(() => res.status(200).json({ message: 'Livre supprimé !'}))
          .catch(error => res.status(400).json({ error }));
      });
    })
    .catch(error => res.status(500).json({ error }));
};

exports.getAll = (req, res, next) => {
  Image.find().then(
    (images) => {
      res.status(200).json(images);
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
  Image.find({  })
    .then(images => {
      images ? (() => {
        for(const image of images){
            const filename = image.contentUrl.split('/ressources/mediatheque/phototheque/')[1];
            fs.unlink(`ressources/mediatheque/phototheque/${filename}`, () => {
            });
        }
        Image.deleteMany({  })
              .then(count => res.status(200).json({ message: `${count.deletedCount} données supprimées !`}))
              .catch(error => res.status(400).json({ error }));
      })() : res.status(200).json({ message: 'Vide.'});
    })
    .catch(error => res.status(500).json({ error }));
};
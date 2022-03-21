const { Ressource } = require('../models/ressource');
const { ressourceFrozen } = require('../models/frozen');
const Role = require('../models/roles');
const User = require('../models/user');
const getHost = require('./getHost').getHost();
const fs = require('fs');

//${req.get('host')}

exports.create = (req, res, next) => {
  const { userId, frozenId } = req.body;
  User.findOne({ _id: userId })
    .then(user => {
      if(user.grade["permission"].find(el => el === 'archives')){
        ressourceFrozen.findOneAndDelete({ _id: frozenId }, {
          projection: {
            sendedAt:0, _id:0, __v:0, kind: 0, frozenType: 0
          }
        })
          .then(frozen => {
            const fileUrl = '.' + frozen._doc.fileUrl.split(`${getHost}`)[1];
            const contentUrl = '.' + frozen._doc["contentUrl"].split(`${getHost}`)[1];
            const ressourceObject = {
              ...frozen._doc
            };
            delete ressourceObject.fileUrl;
            const ressource = new Ressource({
              ...ressourceObject
            });
            Ressource.findOne({ contentUrl: ressource.contentUrl })
              .then(boook => {
                boook ?
                  res.status(400)
                  .json({
                     message: 'Le fichier envoyé est déjà enregistré sur le serveur.'
                    }) : ressource.save()
                          .then(() => {
                            fs.link(fileUrl,
                              contentUrl,
                              err => {
                                if(err){
                                    console.log(err);
                                    return res.status(500).json({ message: 'Erreur interne du serveur' });
                                }else{
                                  res.status(201).json({ message: 'Ressource enregistré !' });
                                }
                              });
                          })
                          .catch(error => {
                            console.log(error);
                            res.status(400).json({ error })
                          });
              })
              .catch(error => {
                console.log(error);
                res.status(400).json({ error })
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
  console.log(req.params);
  Ressource.findOne({
    _id: req.params.id.split('=')[1]
  }).then(
    (ressource) => {
      res.status(200).json(ressource);
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
  const ressourceData = JSON.parse(req.body.ressource)
  const ressourceObject = req.file ?
  {
    ...ressourceData,
    contentUrl: `${req.protocol}://${getHost}/ressources/archives/${req.file.filename}`
  } : { ...ressourceData };
  Ressource.updateOne({ _id: req.params.id.split('=')[1] }, { ...ressourceObject, _id: req.params.id.split('=')[1] })
    .then(() => res.status(200).json({ message: 'Document modifié !' }))
    .catch(error => res.status(400).json({ error })); 
};

exports.delete = (req, res, next) => {
  Ressource.findOne({ _id: req.params.id.split('=')[1] })
    .then(ressource => {
      const filename = ressource.contentUrl.split('/ressources/archives/')[1];
      fs.unlink(`ressources/archives/${filename}`, () => {
        Ressource.deleteOne({ _id: req.params.id.split('=')[1] })
          .then(() => res.status(200).json({ message: 'Document supprimé !'}))
          .catch(error => res.status(400).json({ error }));
      });
    })
    .catch(error => res.status(500).json({ error }));
};

exports.getAll = (req, res, next) => {
  Ressource.find().then(
    (ressources) => {
      res.status(200).json(ressources);
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};

exports.getAllForOne = (req, res, next) => {
  let role = JSON.parse(req.params.role)["role"];
  let roleF = role;
  let type = JSON.parse(req.params.role)["type"];
  User.findOne({ _id: JSON.parse(req.params.role)["userId"] })
    .then(user => {
      const userRole = user.grade["role"];
      if(userRole === role){
        if(type){
          Ressource.find({ "createdBy.role": role}).or([{"type.type": type}, {"type.subtype": type}])
          .then(ressources => {
            return res.status(200).json(ressources);
          })
          .catch(error => { 
            return res.status(400).json({ error });
          });
        }else{
          Ressource.find({ "createdBy.role": role})
          .then(ressources => {
            return res.status(200).json(ressources);
          })
          .catch(error => { 
            return res.status(400).json({ error });
          });
        }
        return
      }
      (async () => {
        while(userRole !== role){
          role = await Role.findOne({ name: role });
          if(!role){
            return res.status(404).json([]);
          }
          role = role["parent"];
          if(userRole === role){
            if(type){
              Ressource.find({ "createdBy.role": roleF }).or([{"type.type": type}, {"type.subtype": type}])
              .then(ressources => res.status(200).json(ressources))
              .catch(error => res.status(400).json({ error }));
            }else{
              Ressource.find({ "createdBy.role": roleF })
              .then(ressources => res.status(200).json(ressources))
              .catch(error => res.status(400).json({ error }));
            }
          }
        }
      })()
        .catch(error => {
          console.log(error);
          res.status(500).json({ error })
        });
    //res.status(400).json({ error: "Ressource introuvable" });
  })
  .catch(error => res.status(500).json({ error }));
}

exports.getAllPublic = (req, res, next) => {
  let type = JSON.parse(req.params.role)["type"];
  
  if(type){
    Ressource.find({ "createdBy.role": 'public'}).or([{"type.type": type}, {"type.subtype": type}])
    .then(ressources => {
      return res.status(200).json(ressources);
    })
    .catch(error => { 
      return res.status(400).json({ error });
    });
  }else{
  Ressource.find({ "createdBy.role": 'public'})
  .then(ressources => {
    return res.status(200).json(ressources);
  })
  .catch(error => { 
    return res.status(400).json({ error });
  });
  }
  return
    //res.status(400).json({ error: "Ressource introuvable" });
}

exports.deleteAll = (req, res, next) => {
  Ressource.find({  })
    .then(ressources => {
      ressources ? (() => {
        for(const ressource of ressources){
            const filename = ressource.contentUrl.split('/ressources/archives/')[1];
            fs.unlink(`ressources/archives/${filename}`, () => {
            });
        }
        Ressource.deleteMany({  })
              .then(count => res.status(200).json({ message: `${count.deletedCount} données supprimées !`}))
              .catch(error => res.status(400).json({ error }));
      })() : res.status(200).json({ message: 'Vide.'});
    })
    .catch(error => res.status(500).json({ error }));
};

exports.addCover = (req,res, next) => {
  Ressource.updateOne({ _id: req.body.contentId },
    { $set: { coverUrl: `${req.protocol}://${getHost}/ressources/covers/${req.body.path}` } })
    .then(() => res.status(200).json({ message: 'Couverture ajoutée avec succès!' }))
    .catch(error => {
      console.log(error);
      res.status(400).json({ error: error.toString() });
    });
};

exports.getStruct = (req, res, next) => {
  User.findOne({ _id: JSON.parse(req.params.struct)["userId"] })
    .then(user => {
      Role.findOne({ name: JSON.parse(req.params.struct)["structName"] })
        .then(role => {
          if(!role){
            return res.status(400).json({childs: [], docTypes: []});
          }
          if(user.grade["role"] === role["name"]){
            return res.status(200).json({childs: role["childs"], docTypes: role["docTypes"]});
          }
          let parent = role["parent"];
          (async () => {
            while(user.grade["role"] !== parent){
              if(!parent){
                return res.status(401).json({ error: Error("L'utilisateur n'a pas le droit d'accès à la ressource")});
              }
              let role = await Role.findOne({ name: parent })
              if(!role){
                return res.status(404).json({childs: [], docTypes: []});
              }
              parent = role["parent"];
            }
            return res.status(200).json({childs: role["childs"], docTypes: role["docTypes"]});
          })();
        })
        .catch(error => res.status(404).json({ error }));
    })
    .catch(error => res.status(404).json({ error }));
};
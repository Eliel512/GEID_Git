const Archive = require('../../models/archives/archive.model');
const Role = require('../../models/users/role.model');
const User = require('../../models/users/user.model');
const getHost = require('./getHost').getHost();
const fs = require('fs');

//${req.get('host')}

exports.getOne = (req, res, next) => {
  console.log(req.params);
  Archive.findOne({
    _id: req.params.id.split('=')[1]
  }).then(
    (archive) => {
      res.status(200).json(archive);
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error: error
      });
    }
  );
};

exports.delete = (req, res, next) => {
  Archive.findOne({ _id: req.params.id.split('=')[1] })
    .then(archive => {
      const filename = archive.contentUrl.split('/archives/archives/')[1];
      fs.unlink(`archives/archives/${filename}`, () => {
        Archive.deleteOne({ _id: req.params.id.split('=')[1] })
          .then(() => res.status(200).json({ message: 'Document supprimé !'}))
          .catch(error => res.status(400).json({ error }));
      });
    })
    .catch(error => res.status(500).json({ error }));
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
                return res.status(401).json({ error: Error("L'utilisateur n'a pas le droit d'accès à la archive")});
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
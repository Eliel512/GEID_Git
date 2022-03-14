const User = require('../models/user');
const Role = require('../models/roles');
const fs = require('fs');
const _ = require('lodash');

const buildWorkspace = (res, user) => {
    fs.mkdir(`./workspace/${user._id}/images`, {recursive: true}, err => {
        if(err){
          console.log(err);
          res.status(500).json({ err });
        }else{
          fs.mkdir(`./workspace/${user._id}/videos`, {recursive: true}, err => {
            if(err){
              console.log(err);
              res.status(500).json({ err });
            }else{
              fs.mkdir(`./workspace/${user._id}/documents`, {recursive: true}, err => {
                if(err){
                  console.log(err);
                  res.status(500).json({ err });
                }else{
                  res.status(201).json({
                    message: 'Inscription réussie!'
                })
                }
              });
            }
          });
        }
    })
};

exports.getAllUsers = (req, res, next) => {
    User.find({ }, { __v : 0, password : 0, _id: 0 })
      .then(users => res.status(200).json(users))
      .catch(error => {
        console.log(error);
        res.status(500).json(error)
    });
};

exports.getUsersByProps = (req, res, next) => {
    const { props, value } = req.params.datas;
    const query = {};
    query[props] = value;
    User.find(query, { __v : 0, password : 0 })
      .then(users => res.status(200).json(users))
      .catch(error => {
          console.log(error);
          res.status(400).json(error)
      });
};

exports.getOneUser = (req, res, next) => {
    User.findOne({ _id: req.params.userId }, { __v: 0, password: 0 })
      .then(user => res.status(200).json(user))
      .catch(() => res.status(404).json({ message: 'Utilisateur introuvable' }));
};

exports.AddOneUser = (req, res, next) => {
    const userObject = {
        ...req.body
    };
    delete userObject._id;
    delete userObject.password;
    bcrypt.hash(req.body.password, 10)
      .then(hash => {
        Role.findOne({ name: req.body.grade["role"] })
          .then(role => {
              role ? (() => {
                const user = new User({
                    ...userObject,
                    password: hash
                  });
                  user.save()
                    .then(() => buildWorkspace(res, user))
                    .catch(error => {
                      console.log(error);
                      res.status(400).json({ error })
                  })
                })() : (() => {
                    return res.status(400).json({ message: "Grade incorrect" });
                })();
          })
          .catch(error => res.status(500).json({ error }));
      })
      .catch(error => {
        console.log(error);
        res.status(500).json({ error })
      });
};

exports.modifyUser = (req, res, next) => {
    const userObject = {
        ...req.body
    };
    delete userObject.userId;
    delete userObject._id;
    User.updateOne({ _id: req.body.userId }, { ...userObject, _id: req.body.userId })
      .then(() => res.status(200).json({ message: 'Utilisateur mis à jour avec succès !' }))
      .catch(error => res.status(400).json({ error }));
};

exports.modifyUserPermission = (req, res, next) => {
    User.updateOne({ _id: req.body.userId }, {$set: {'grade.permission': req.body.permissions}})
      .then(() => {
          User.findOne({ _id: req.body.userId }, { 'grade.permission': 1, __id: 0 })
            .then(grade => {
                res.status(200).json({ 
                    message: 'Utilisateur mis à jour avec succès !',
                    permissions: grade.permission
                 });
            })
            .catch(error => res.status(500).json({ error }));
      })
      .catch(error => {
          console.log(error);
          res.status(400).json({ error })
      });
};

exports.addOrRemoveUserPermission = (req, res, next) => {
    const mode = req.params.mode;
    switch(mode){
        case 'add':
            User.findOne({ _id: req.body.userId })
              .then(user => {
                user.grade["permission"].push(req.body.permission);
                user.save()
                  .then(() => res.status(200).json({ 
                    message: 'Utilisateur mis à jour avec succès !',
                    permissions: grade.permission
                 }))
                  .catch(error => {
                      console.log(error);
                      res.status(500).json({ error });
                    });
              })
              .catch(error => {
                  console.log(error)
                  res.status(400).json({ error });
              });
        break;
        case 'remove':
            User.findOne({ _id: req.body.userId })
              .then(user => {
                _.remove(user.grade["permission"], el => el === req.body.permission);
                user.save()
                  .then(() => res.status(200).json({ 
                    message: 'Utilisateur mis à jour avec succès !',
                    permissions: grade.permission
                 }))
                  .catch(error => {
                      console.log(error);
                      res.status(500).json({ error });
                    });
              })
              .catch(error => {
                  console.log(error)
                  res.status(400).json({ error });
              });
        break;
        default: res.status(400).json({ message: 'Mode incorrect' })
    }
}

exports.getAllRoles = (req, res, next) => {
  Role.find({}, { _id: 0, __v: 0 })
    .then(roles => {
      res.status(200).json(roles);
    })
    .catch(error => {
      console.log(error);
      res.status(500).json({ error })
    });
};

exports.addOneRole = (req, res, next) => {
  const roleObject = {
    ...req.body
  };
  delete roleObject._id;
  const role = new Role({
    ...roleObject
  });
  role.save()
    .then(() => res.status(201).json({
      message: 'Opération éffectuée avec succès!'
    }))
    .catch(error => {
      console.log(error);
      res.status(400).json({
        error
      });
    });
};
const fs = require('fs');
const User = require('../models/user');
const Role = require('../models/roles');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const config = require('../config');
const getHost = require('./getHost').getHost();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 25,
    auth: {
      user: 'danticbudget@gmail.com',
      pass: 'BudgetDantic@20222023'
    },
    tls: {
      rejectUnauthorized: false
  }
});

exports.init = (req, res, next) => {
  const GRADES = config.GRADES;
  gradeNRoles = {};
  for(grade of GRADES){
    gradeNRoles[grade] = [];
  }
  Role.find({  })
    .then(roles => {
      for(role of roles){
        let name = role["name"];
        if(name.match("SECRETARIAT GENERAL")){
          gradeNRoles["SECRETAIRE GENERAL"].push(name);
        }
        else if(name.match("DIRECTION GENERAL")){
          gradeNRoles["DIRECTEUR GENERAL"].push(name);
          let directions = role["childs"].filter(child => child.match("DIRECTION"));
          if(directions){
            for(direction of directions){
              gradeNRoles["DIRECTEUR"].push(direction);
            }
          }
        }
        else if(name.match("DIRECTION")){
          gradeNRoles["DIRECTEUR"].push(name)
        }
        else if(name.match("CELLULE") || name.match("DIVISION")){
          gradeNRoles["CHEF DE DIVISION"].push(name)
        }
        else if(name.match("BUREAU")){
          gradeNRoles["CHEF DE BUREAU"].push(name)
        }
        else if(name.match("SECRETARIAT")){
          gradeNRoles["SECRETAIRE"].push(name)
        }
      }
      res.status(200).json(gradeNRoles);
    })
    .catch(error => {
      console.log(error);
      res.status(500).json({ error })
    });
};

exports.signup = (req, res, next) => {
    //console.log(req.body);
    // 620bf719b15f670a9fe5a427
    // 620a27432e05c11da6e012ee
    bcrypt.hash(req.body.password, 10)
      .then(hash => {
        let role = req.body.grade["role"];
        let grade = req.body.grade["grade"];
        Role.findOne({ name: role })
          .then(role => {
            if(role){
              const user = req.body.mname ? new User({
                fname: req.body.fname,
                lname: req.body.lname,
                mname: req.body.mname,
                grade: {grade: grade, role: role['name']},
                email: req.body.email,
                phoneCell: req.body.phoneCell,
                password: hash
              }) : new User({
                fname: req.body.fname,
                lname: req.body.lname,
                grade: {grade: grade, role: role['name']},
                email: req.body.email,
                phoneCell: req.body.phoneCell,
                password: hash
              });
              user.save()
                .then(() => {
                  fs.mkdir(`./workspace/${user._id}/images`, {recursive: true}, err => {
                    if(err){
                      console.log(err);
                      res.status(500).json({ message: 'Erreur interne du serveur' });
                    }else{
                      fs.mkdir(`./workspace/${user._id}/videos`, {recursive: true}, err => {
                        if(err){
                          console.log(err);
                          res.status(500).json({ message: 'Erreur interne du serveur' });
                        }else{
                          fs.mkdir(`./workspace/${user._id}/documents`, {recursive: true}, err => {
                            if(err){
                              console.log(err);
                              res.status(500).json({ message: 'Erreur interne du serveur' });
                            }else{
                              res.status(201).json({
                                message: 'Inscription réussie!'
                            })
                            }
                          });
                        }
                      });
                    }
                  })})
                .catch(error => {
                  console.log(error);
                  res.status(400).json({ error })
              });
            }else{
              return res.status(400).json({ message: "Grade incorrect" })
            }
          })
          .catch(() => res.status(500).json({ message: 'Erreur interne du serveur' }));
      })
      .catch(error => {
        console.log(error);
        res.status(500).json({ error })
      });
};

exports.login = (req, res, next) => {
    User.findOne({ email: req.body.email }, {joinedAt:0, __v:0})
      .then(user => {
        if (!user) {
          return res.status(404).json({ error: 'Utilisateur non trouvé !' });
        }
        bcrypt.compare(req.body.password, user.password)
          .then(valid => {
            if (!valid) {
              return res.status(400).json({ error: 'Mot de passe incorrect !' });
            }
            let docTypes = [];
            Role.findOne({ name: user.grade["role"] })
              .then(role => {
                docTypes = role["docTypes"];
                user.mname ?
              res.status(200).json({
                userId: user._id,
                userFname: user.fname,
                userMname: user.mname,
                userLname: user.lname,
                userEmail: user.email,
                userGrade: user.grade,
                userImage: user.imageUrl,
                permission: user.permission,
                docTypes: docTypes,
                token: jwt.sign(
                    {userId: user._id},
                    'RANDOM_TOKEN_SECRET',
                    {expiresIn: '24h'}
                )
              }) : res.status(200).json({
                userId: user._id,
                userFname: user.fname,
                userLname: user.lname,
                userGrade: user.grade,
                userEmail: user.email,
                userImage: user.imageUrl,
                permission: user.permission,
                docTypes: docTypes,
                token: jwt.sign(
                    {userId: user._id},
                    'RANDOM_TOKEN_SECRET',
                    {expiresIn: '24h'}
                )
              });
            })
          })
          .catch(error => res.status(400).json({ error }));
      })
      .catch(error => res.status(400).json({ error }));
};

exports.validate = (req, res, next) => {
  const num = Math.floor(Math.random()*100);
  const mailOptions = {
    from: 'danticbudget@gmail.com',
    to: req.body.email,
    subject: `GEDANTIC ${num} mail validation`,
    text: `Votre code de validation: ${req.body.key}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if(error){
      res.status(401).json({ error });
    }else{
      res.status(200).json({ message: info.response});
    }
  })
};

exports.addProfil = (req, res, next) => {
  User.updateOne(
    { _id: req.body.userId },
    { imageUrl: `${req.protocol}://${getHost}/profils/profil_${req.body.userId}` }
    )
      .then(user => {
        if (!user) {
          return res.status(400).json({ message: 'Utilisateur non trouvé !' });
        }
        res.status(201).json({ message: 'Photo de profile ajoutée avec succès !' })
      })
      .catch(error => res.status(400).json({ error }));
};
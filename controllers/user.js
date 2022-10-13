const fs = require('fs');
const User = require('../models/user');
const Role = require('../models/roles');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const config = require('../config');
const getHost = require('./getHost').getHost();
//BudgetDantic@20222023
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.GEID_EMAIL,
      pass: process.env.GEID_PASS
    },
    /*tls: {
      rejectUnauthorized: false
  }*/
});

transporter.verify((error, success) => {
  if(error){
    console.log(error);
  }
  else{
    console.log('Connexion au serveur SMTP réussie!')
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
        else if(name.match("DIRECTION") && !name.match("SECRETARIAT")){
          gradeNRoles["DIRECTEUR"].push(name)
        }
        else if(name.match("CELLULE") || name.match("DIVISION") || name.match("CORPS")){
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
    User.findOne({ email: req.body.email }, {joinedAt: 0, __v: 0})
      .then(user => {
        if (!user) {
          return res.status(404).json({ error: 'Utilisateur non trouvé !' });
        }
        if(!user.isValid){
          return res.status(401).json({
            message: 'Veuillez valider votre adresse mail avant de vous connecter.'
          });
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
                phoneCell: user.phoneCell,
                permission: user.permission,
                docTypes: docTypes,
                token: jwt.sign(
                    {user: {
                      _id: user._id,
                      fname: user.fname,
                      mname: user.mname,
                      lname: user.lname,
                      grade: user.grade,
                      docTypes: user.docTypes
                    }},
                    process.env.TOKEN_KEY,
                    {expiresIn: '24h'}
                )
              }) : res.status(200).json({
                userId: user._id,
                userFname: user.fname,
                userLname: user.lname,
                userGrade: user.grade,
                userEmail: user.email,
                userImage: user.imageUrl,
                phoneCell: user.phoneCell,
                permission: user.permission,
                docTypes: docTypes,
                token: jwt.sign(
                    {user: {
                      _id: user._id,
                      fname: user.fname,
                      mname: user.mname,
                      lname: user.lname,
                      grade: user.grade,
                      docTypes: user.docTypes
                    }},
                    process.env.TOKEN_KEY,
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
    from: process.env.GEID_EMAIL,
    to: req.body.email,
    subject: `GEDANTIC ${num} mail validation`,
    text: `Votre code de validation: ${req.body.key}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if(error){
      res.status(401).json({ message: 'Une erreur est survenue' });
    }else{
      User.updateOne({ email: req.body.email }, { $set: { isValid: true } })
        .then(() => res.status(200).json({ message: info.response}))
        .catch(err => {
          console.log(err);
          res.status(500).json({
            message: 'Une erreur est survenue, veuillez réessayer!'
          })
        });
    }
  })
};

exports.edit = (req, res, next) => {
  const { password } = req.body;
  let body = {};

  if(!(req.body.email || password || req.body.phoneCell)){
    return res.status(400).json({ message: 'Données invalides.' });
  }

  Object.keys(req.body).forEach(key => {
    switch(key){
      case 'email':
        body.email = req.body[key];
        break;
      case 'phoneCell':
        body.phoneCell = req.body[key];
        break;
    }
  });
 
  if(password){
    bcrypt.hash(password, 10)
      .then(hash => {
        User.updateOne({ _id: res.locals.user._id }, { password: hash, ...body })
          .then(() => res.status(200).json({ message: 'Profile édité avec succès!' }))
          .catch(error => {
            console.log(error);
            res.status(400).json({ message: 'Certaines données semblent invalides.' });
          });
      })
      .catch(error => {
        console.log(error);
        res.status(500).json({ message: 'Une erreur est survenue, veuillez réessayer.' });
      });
    }else {
      User.updateOne({ _id: res.locals.user._id }, { ...body })
        .then(() => res.status(200).json({ message: 'Profile édité avec succès!' }))
        .catch(error => {
          console.log(error);
          res.status(400).json({ message: 'Certaines données semblent invalides.' });
        });
    }  
};

exports.addProfil = (req, res, next) => {
  User.updateOne(
    { _id: req.userId },
    { imageUrl: `${req.protocol}s://${getHost}/profils/${req.file.filename}` }
    )
      .then(() => {        
        res.status(200).json({ imageUrl: `${req.protocol}s://${getHost}/profils/${req.file.filename}` })
      })
      .catch(error => {
        console.log(error);
        res.status(500).json({        
        message: 'Une erreur est survenue, veuillez réessayer.'
      })
    });
};

exports.getUsersList = (req, res, next) => {
  User.find({  }, { __v:0, password:0 })
    .then(users => res.status(200).json(users))
    .catch(error => {
      console.log(error);
      res.status(500).json({ message: 'Une erreur est survenue!' });
    });
};
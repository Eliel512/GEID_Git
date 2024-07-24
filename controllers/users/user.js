const fs = require('fs');
const User = require('../../models/users/user.model');
const Role = require('../../models/users/role.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const config = require('../../config');
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

// Fonction pour afficher les informations de connexion du transporteur
function displayTransporterInfo(transporter) {
  const info = {
    host: transporter.options.host,
    port: transporter.options.port,
    secure: transporter.options.secure,
    user: transporter.options.auth.user,
    // servername: transporter.options.tls.servername,
  };

  console.log('Informations de connexion du transporteur SMTP:');
  console.log(info);
}

// Afficher les informations de connexion du transporteur
// displayTransporterInfo(transporter);

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
          let directions = role["children"].filter(child => child.match("DIRECTION"));
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
        else if(name.match("AGENT")){
          gradeNRoles["AGENT"].push(name)
        }
      }
      res.status(200).json(gradeNRoles);
    })
    .catch(error => {
      console.log(error);
      res.status(500).json({ error })
    });
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
  //64071e41c042e427fe4561c3
  // eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2NDA3MWU0MWMwNDJlNDI3ZmU0NTYxYzMiLCJpYXQiOjE2NzkwNzI2MjgsImV4cCI6MTY3OTI0NTQyOH0.Y_AcpfFzP-VcYGUUJ0_qtKnW925tMWrOggkPIlvv2_U
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

exports.checkUser = async (req, res) => {
  const { type } = req.body;
  switch(type){
    case 'token':
      try {
        const token = req.body.token;
        const decodedToken = jwt.verify(token, process.env.TOKEN_KEY);
        //const userId = decodedToken.user._id;        
      }catch{
        return res.status(404).json({ found: false });
      }
      break;
    case 'email':
      const userExists = await User.exists({ email: req.body.email });
      if(!userExists){
        return res.status(404).json({ found: false });
      }
      break;
    default:
      return res.status(400).json({ message: '\'type\' incorrect.'})
  }
  return res.status(200).json({ found: true });
};
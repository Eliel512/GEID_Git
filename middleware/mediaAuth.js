const User = require('../models/user');
const authorizeds = [
    "BUREAU BIBLIOTHEQUE, PHOTOTHEQUE ET FILMOTHEQUE",
    "DIVISION ARCHIVES, BIBLIOTHEQUE ET PUBLICATIONS",
    "DIRECTION ARCHIVES & NOUVELLES TECHNOLOGIES DE L'INFORMATION ET DE LA COMMUNICATION"
];

module.exports = async userId => new Promise((resolve, reject) => {
    User.findOne({ _id: userId })
      .then(user => {
          if(authorizeds.find(role => role === user.grade["role"])){
              resolve(true);
          }else{
              resolve(false);
          }
      })
      .catch(error => {
          reject(error);
      })
});
const Archive = require('../../models/archives/archive.model');
const Role = require('../../models/users/role.model');
const User = require('../../models/users/user.model');

module.exports = async (req, res, next) => {
  let { role, type } = JSON.parse(req.params.role);
  let roleF = role;
  //let  = JSON.parse(req.params.role)["type"];
  
  User.findOne({ _id: res.locals.userId })
    .then(user => {
      const userRole = user.grade["role"];
      if(userRole === role){
        if(type){
          Archive.find({
            administrativeUnit: role
          }).or([{
            "type.type": type
          },{
            "type.subtype": type
          }])
          .then(archives => {
            return res.status(200).json(archives);
          })
          .catch(error => {
            console.log(error);
            return res.status(500).json({ message: 'Une erreur est survenue' });
          });
        }else{
          Archive.find({ administrativeUnit: role})
          .then(archives => {
            return res.status(200).json(archives);
          })
          .catch(error => {
            console.log(error);
            return res.status(500).json({ message: 'Une erreur est survenue' });
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
              Archive.find({ administrativeUnit: roleF }).or([{"type.type": type}, {"type.subtype": type}])
              .then(archives => res.status(200).json(archives))
              .catch(error => {
                console.log(error);
                res.status(500).json({ message: 'Une erreur est survenue' })
              });
            }else{
              Archive.find({ administrativeUnit: roleF })
                .then(archives => res.status(200).json(archives))
                .catch(error => {
                  console.log(error);
                  res.status(500).json({ message: 'Une erreur est survenue' })
                });
            }
          }
        }
      })()
        .catch(error => {
          console.log(error);
          res.status(500).json({ message: 'Une erreur est survenue' })
        });
    //res.status(400).json({ error: "Archive introuvable" });
  })
    .catch(error => res.status(500).json({ message: 'Une erreur est survenue' }));
}
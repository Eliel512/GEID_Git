const User = require('../../models/users/user.model');
const Auth = require('../../models/users/auth.model');
const Archive = require('../../models/archives/archive.model');

module.exports = (req, res, next) => {
    User.findOne({ _id: res.locals.userId }, { auth: 1 })
      .then(user => {
            Auth.findOne({ _id: user.auth })
              .then(auth => {
                    if(!auth.privileges.some(priv => priv.app == 'archives')){
                        return res.status(401).json({ message: 'Operation impossible' });
                    }
                    const structs = [];
                    auth.privileges.forEach(priv => priv.permissions.forEach(permission => {
                        if(permission.access === 'write') structs.push(permission.struct);
                    }));
                    res.locals.structs = structs;
                    next();
                })
              .catch(error => {
                    console.log(error);
                    return res.status(500).json({ message: 'Une erreur est survenue' });
                });
        })
      .catch(error => {
            console.log(error);
            return res.status(500).json({ message: 'Une erreur est survenue' });
        });
};
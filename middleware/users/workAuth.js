const Auth = require('../../models/users/auth.model');
const User = require('../../models/users/user.model');

module.exports = (res, res, next) => {
    User.findOne({ _id: res.locals.userId }, { auth: 1 })
        .then(user => {
            Auth.findOne({ _id: user.auth }, { privileges: 1 })
             .then(auth => {
                if(!auth.privileges.some(priv => priv.app == 'workspace')){
                    return res.status(401).json({ message: 'Operation impossible' });
                }
                next();
             })
             .catch(error => {
                console.log(error);
                return res.status(500).json({ message: 'Une erreur est survenue' });
             });
        })
        .catch(error => {
            console.log(error);
            return res.status(500).json({ message: 'Une erreur est survenue' })
        });
};
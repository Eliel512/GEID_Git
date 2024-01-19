const Auth = require('../../../models/users/auth.model');

module.exports = (req, res) => {
    Auth.find({  }, { __v: 0 })
        .then(auths => res.status(200).json(auths))
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};
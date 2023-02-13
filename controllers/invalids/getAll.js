const Invalid = require('../../models/archives/invalid.model');

module.exports = (req, res, next) => {
    Invalid.find({ management: res.locals.userId })
        .then(invalids => {
            res.status(200).json(invalids);
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};
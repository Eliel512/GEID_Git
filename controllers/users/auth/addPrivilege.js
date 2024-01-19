const Auth = require('../../../models/users/auth.model');

module.exports = (req, res) => {
    Auth.findOneAndUpdate({ _id: req.body.id
    }, { $push: { 'privileges': { $each: req.body.privileges } }
    }, { returnDocument: 'after' })
        .then(auth => res.status(200).json(auth))
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' })
        });
};
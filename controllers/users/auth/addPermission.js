const Auth = require('../../../models/users/auth.model');

module.exports = (req, res) => {
    Auth.findOneAndUpdate({
        _id: req.body.id, 'privileges.app': req.body.app
    }, { $addToSet: { $each: req.body.permissions
    }, $setOnInsert: { 'privileges.app': req.body.app } }, { upsert: true, returnDocument: 'after' })
        .then(auth => res.status(200).json(auth))
        .catch(error => {
            console.log(error);
        });
};
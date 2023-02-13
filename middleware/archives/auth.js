const User = require('../../models/users/user.model');

module.exports = (req, res, next) => {
    User.exists({ _id: res.locals.userId, "auth.readNWrite": 'archives' })
        .then(() => next())
        .catch(error => {
            console.log(error);
            return res.status(500).json({ message: 'Une erreur est survenue' });
        })
};
const Auth = require('../../../models/users/auth.model');

module.exports = (req, res) => {
    const newAuth = new Auth({
        name: req.body.name,
        privileges: [...req.body.privileges]
    });

    newAuth.save()
        .then(() => {
            res.status(201).json({ ...newAuth });
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
    
};
const User = require('../../models/users/user.model');
const Auth = require('../../models/users/auth.model');
const Archive = require('../../models/archives/archive.model');
const Profil = require('../../models/archives/profil.model');

module.exports = (req, res, next) => {
    User.findOne({ _id: res.locals.userId }, { auth: 1 })
        .then(user => {
            Auth.findOne({ _id: user.auth })
                .then(async auth => {
                    let administrativeUnit;
                    try{
                        const archive = await Archive.findOne({
                            _id: req.body.id
                        }, { administrativeUnit: 1 });
                        administrativeUnit = archive.administrativeUnit;
                    }catch(error){
                        console.log(error);
                        return res.status(500).json({ message: 'Une erreur est survenue' });
                    }
                    if(!auth.privileges.some(
                        privilege => privilege.app == 'archives'
                        && privilege.permissions.some(
                            permission => (permission.struct == administrativeUnit
                                || permission.struct == 'all')
                            && permission.access == 'write'))){
                    
                        return res.status(401).json({ message: 'Opération non autorisée' });
                    }
                    try{
                        const profil = await Profil.findOne({ name: 'default' }, { _id: 1 });
                        res.locals.profil = req.body.profil ? req.body.profil : profil._id;
                    }catch(error){
                        console.log(error);
                        return res.status(500).json({ message: 'Une erreur est survenue' });
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
            return res.status(500).json({ message: 'Une erreur est survenue' });
        });
};
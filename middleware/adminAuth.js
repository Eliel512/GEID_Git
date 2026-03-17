const User = require('../models/users/user.model');
const mongoose = require('mongoose');

module.exports = (req, res, next) => {
    const userId = res.locals.userId;    
    User.findOne({ _id: userId },{ "grade.permission": 1, _id: 0 })
        .then(grade => {
            if(!grade || !grade.grade || !grade.grade.permission){
                return res.status(401).json({ message: 'Non authorisé' });
            }
            const permission = grade.grade.permission;
            if(permission.find(el => el === 'admin')){
                next();
            }else{
                res.status(401).json({ message: 'Non authorisé' })
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ message: "Une erreur est survenue. Veuillez reessayer." })
        });
};
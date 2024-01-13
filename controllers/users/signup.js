const fs = require('fs');
const User = require('../../models/users/user.model');
const Role = require('../../models/users/role.model');
const Auth = require('../../models/users/auth.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    bcrypt.hash(req.body.password, 10)
        .then(hash => {
            let { role, grade }  = req.body.grade;
            Role.findOne({ name: role.label })
                .then(async role => {
                    if (role) {
                        let auth;
                        try{
                            auth = await Auth.findOne({ name: 'default' }, { _id: 1 })._id;
                            if(!auth){
                                return res.status(500).json({ message: 'Une erreur est survenue' });
                            }
                        }catch(error){
                            return res.status(500).json({ message: 'Une erreur est survenue' });
                        }
                        const user = new User({
                            fname: req.body.fname,
                            lname: req.body.lname,
                            mname: req.body.mname,
                            grade: { grade: grade, role: role['name'] },
                            auth: auth,
                            email: req.body.email,
                            phoneCell: req.body.phoneCell,
                            password: hash
                        });
                        user.save()
                            .then(() => {
                                fs.mkdir(`../../workspace/${user._id}/images`, { recursive: true }, err => {
                                    if (err) {
                                        console.log(err);
                                        res.status(500).json({ message: 'Erreur interne du serveur' });
                                    } else {
                                        fs.mkdir(`../../workspace/${user._id}/videos`, { recursive: true }, err => {
                                            if (err) {
                                                console.log(err);
                                                res.status(500).json({ message: 'Erreur interne du serveur' });
                                            } else {
                                                fs.mkdir(`../../workspace/${user._id}/documents`, { recursive: true }, err => {
                                                    if (err) {
                                                        console.log(err);
                                                        res.status(500).json({ message: 'Erreur interne du serveur' });
                                                    } else {
                                                        res.status(201).json({
                                                            message: 'Inscription réussie!'
                                                        })
                                                    }
                                                });
                                            }
                                        });
                                    }
                                })
                            })
                            .catch(error => {
                                console.log(error);
                                res.status(500).json({ message: 'Erreur interne du serveur' });
                            });
                    } else {
                        return res.status(400).json({ message: "Grade incorrect" })
                    }
                })
                .catch(() => res.status(500).json({ message: 'Erreur interne du serveur' }));
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Erreur interne du serveur' })
        });
};
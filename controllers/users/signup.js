const fs = require('fs');
const path = require('path');
const storage = require('../../tools/storage');
const User = require('../../models/users/user.model');
const Role = require('../../models/users/role.model');
const Auth = require('../../models/users/auth.model');
const bcrypt = require('bcryptjs');
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
                            const authDoc = await Auth.findOne({ name: 'default' }, { _id: 1 });
                            if(!authDoc){
                                return res.status(500).json({ message: 'Une erreur est survenue' });
                            }
                            auth = authDoc._id;
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
                                const base = path.join(__dirname, '../../workspace', user._id.toString());
                                fs.mkdir(path.join(base, 'images'), { recursive: true }, err => {
                                    if (err) {
                                        console.log(err);
                                        res.status(500).json({ message: 'Erreur interne du serveur' });
                                    } else {
                                        fs.mkdir(path.join(base, 'videos'), { recursive: true }, err => {
                                            if (err) {
                                                console.log(err);
                                                res.status(500).json({ message: 'Erreur interne du serveur' });
                                            } else {
                                                fs.mkdir(path.join(base, 'documents'), { recursive: true }, err => {
                                                    if (err) {
                                                        console.log(err);
                                                        res.status(500).json({ message: 'Erreur interne du serveur' });
                                                    } else {
                                                        // Dual-write: ensure workspace dirs in MinIO (no-op)
                                                        const uid = user._id.toString();
                                                        Promise.all([
                                                            storage.ensureDir(`workspace/${uid}/images`),
                                                            storage.ensureDir(`workspace/${uid}/videos`),
                                                            storage.ensureDir(`workspace/${uid}/documents`),
                                                        ]).catch(e => console.error('[MinIO] signup ensureDir:', e.message));
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
const User = require('../../models/users/user.model');
const Role = require('../../models/users/role.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    User.findOne({ email: req.body.email }, { joinedAt: 0, __v: 0 })
        .populate({
            path: 'auth',
            select: '_id name privileges',
            populate: {
                path: 'permissions.struct',
                select: '_id name'
            }
        })
        .exec((err, user) => {
            if(err){
                return res.status(400).json({
                    message: 'Vérifiez la validité des données.'
                })
            }
            if (!user) {
                return res.status(404).json({ error: 'Utilisateur non trouvé !' });
            }
            if (!user.isValid) {
                return res.status(401).json({
                    message: 'Veuillez valider votre adresse mail avant de vous connecter.'
                });
            }
            bcrypt.compare(req.body.password, user.password)
                .then(valid => {
                    if (!valid) {
                        return res.status(400).json({ message: 'Mot de passe incorrect !' });
                    }
                    let docTypes = [];
                    Role.findOne({ name: user.grade["role"] })
                        .then(role => {
                            docTypes = role["docTypes"];
                            res.status(200).json({
                                userId: user._id,
                                userFname: user.fname,
                                userMname: user.mname,
                                userLname: user.lname,
                                userEmail: user.email,
                                userGrade: user.grade,
                                auth: user.auth,
                                userImage: user.imageUrl,
                                phoneCell: user.phoneCell,
                                permission: user.permission,
                                docTypes: docTypes,
                                token: jwt.sign(
                                    { _id: user._id },
                                    process.env.TOKEN_KEY,
                                    { expiresIn: '48h' }
                                )
                            });
                        })
                        .catch(error => res.status(500).json({
                            message: 'Une erreur est survenue, veuillez réessayer.'
                        }));
                })
                .catch(error => res.status(400).json({
                    message: 'Vérifiez la validité des données.'
                }));
        });
};
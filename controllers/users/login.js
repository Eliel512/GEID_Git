const User = require('../../models/users/user.model');
const Role = require('../../models/users/role.model');
const Auth = require('../../models/users/auth.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports = async (req, res) => {
    try {
        const user = await User.findOne(
            { email: req.body.email },
            { joinedAt: 0, __v: 0 }
        ).populate({
            path: 'auth',
            model: Auth,
            select: '_id name privileges upper'
        });

        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé !' });
        }

        if (!user.isValid) {
            return res.status(401).json({
                message: 'Veuillez valider votre adresse mail avant de vous connecter.'
            });
        }

        const valid = await bcrypt.compare(req.body.password, user.password);
        if (!valid) {
            return res.status(400).json({ message: 'Mot de passe incorrect !' });
        }

        const role = await Role.findOne({ name: user.grade.role });
        const docTypes = role ? role.docTypes : [];

        return res.status(200).json({
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
            docTypes,
            token: jwt.sign(
                { _id: user._id },
                process.env.TOKEN_KEY,
                { expiresIn: '48h' }
            )
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Une erreur est survenue, veuillez réessayer.' });
    }
};

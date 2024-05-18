const Archive = require('../../models/archives/archive.model');
// const Doc = require('../../models/archives/doc.model');
// const Profil = require('../../models/archives/profil.model');
// const Folder = require('../../models/archives/folder.model');
// const Role = require('../../models/users/role.model');
// const User = require('../../models/users/user.model');
// const fs = require('fs');
// const path = require('path');
// const getPath = require('../../tools/getRoleUrl');

module.exports = (req, res) => {
    Archive.findOneAndUpdate({
        _id: req.body.id
    }, { $set: {
        classNumber: req.body.classNumber,
        refNumber: req.body.refNumber,
        'type.profil': res.locals.profil,
        validated: true
    } }, { new: true })
        .then(archive => {
            res.status(200).json(archive);
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};
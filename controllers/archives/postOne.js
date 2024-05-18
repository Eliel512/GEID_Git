// const Invalid = require('../../models/archives/invalid.model');
const Archive = require('../../models/archives/archive.model');
const Doc = require('../../models/archives/doc.model');
const Profil = require('../../models/archives/profil.model');
const Folder = require('../../models/archives/folder.model');
const Role = require('../../models/users/role.model');
const User = require('../../models/users/user.model');
const fs = require('fs');
const path = require('path');
const getPath = require('../../tools/getRoleUrl');

module.exports = (req, res, next) => {
    Doc.findOne({ _id: req.body.doc })
        .then(async doc => {
            // console.log(req.body);
            const docId = doc._id;
            const mainDir = path.dirname(require.main.filename);
            delete doc._id;
            let defaultProfil, folder, userRole;
            try{
                let userRoleName = await User.findOne({
                    _id: res.locals.userId
                }, { "grade.role": 1 });
                userRoleName = userRoleName.grade.role;
                defaultProfil = await Profil.findOne({
                    name: 'default'
                }, { _id: 1 });
                userRole = await Role.findOne({
                    name: userRoleName
                }, { _id: 1, name: 1 });
                folder = await Folder.findOne({
                    name: req.body.folder
                }, { _id: 1 });
            }catch(error){
                console.log(error);
                return res.status(500).json({ message: 'Une erreur est survenue' })
            }
            const fileUrl = await getPath(userRole.name);
            if (!fileUrl) {
                return res.status(500).json({ message: 'Une erreur est survenue' });
            }
            try {
                fs.mkdirSync(
                    path.join(mainDir, 'ARCHIVES', fileUrl),
                    { recursive: true }
                );
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    console.log(error);
                    return res.status(500).json({ message: 'Une erreur est survenue' });
                }
            }
            try{
                fs.copyFileSync(
                    path.join(mainDir, doc.contentUrl),
                    path.join(mainDir, 'ARCHIVES', fileUrl, path.basename(doc.contentUrl)),
                    fs.constants.COPYFILE_EXCL
                );
            }catch(error){
                if (error.code === 'EEXIST') {
                    return res.status(409).json({
                        message: 'Le fichier a déja été envoyé, renommez-le s\'il s\'agit d\'une autre version'
                    });
                }
                console.log(error);
                return res.status(500).json({ message: 'Une erreur est survenue' });
            }
            const newArchive = new Archive({
                ...doc,
                ...req.body,
                type: {
                    ...req.body.type,
                    profil: defaultProfil._id
                },
                folder: folder._id,
                administrativeUnit: userRole._id,
                fileUrl: path.join('ARCHIVES', fileUrl, path.basename(doc.contentUrl))
            });
            newArchive.save()
                .then(() => {
                    return res.status(201).json(newArchive);
                })
                .catch(error => {
                    console.log(error);
                    return res.status(500).json({ message: 'Une erreur est survenue' });
                });
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};
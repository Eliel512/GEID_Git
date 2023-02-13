const Invalid = require('../../models/archives/invalid.model');
const Role = require('../../models/users/role.model');
const User = require('../../models/users/user.model');
const Event = require('../../models/archives/event.model');
const path = require('path');
const fs = require('fs');
const getPath = require('../../tools/getRoleUrl');

module.exports =  async (req, res, next) => {    
    try {
        const userRole = await User.findOne({
            _id: res.locals.userId
        }, { "grade.role": 1 }).grade.role;
        const userIsInEvent = await Event.exists({
            name: req.body.event, administrativeUnits: userRole
        });
        const management = await Role.findOne({
            name: userRole
        }, { management: 1 }).management;

        if(!management){
            return res.status(400).json({
                message: 'Aucun service défini pour la gestion de vos archives'
            });
        }

        if(!userIsInEvent){
            return res.status(400).json({ message: '\'event\' incorrect' });
        }

        const fileUrl = await getPath(userRole);
        if(!fileUrl){
            return res.status(500).json({ message: 'Une erreur est survenue' });
        }

        try {
            fs.mkdirSync(
                path.join(__dirname, 'archives', fileUrl, 'pending'),
                { recursive: true }
            );
        } catch (error) {
            if(error.code !== 'EEXIST'){
                console.log(error);
                return res.status(500).json({ message: 'Une erreur est survenue' });
            }
        }

        try {
            fs.copyFileSync(
                path.join(__dirname, 'workspace', res.locals.userId, 'documents', req.body.fileName),
                path.join(__dirname, 'archives', fileUrl, 'pending', req.body.fileName),
                fs.constants.COPYFILE_EXCL
            );

            const invalid = new Invalid({
                type: {
                    type: req.body.type,
                    subtype: req.body.subtype
                },
                designation: req.body.designation.toUpperCase(),
                description: req.body.description,
                administrativeUnit: userRole,
                event: req.body.event,
                notes: req.body.notes,
                fileUrl: path.join('archives', fileUrl, 'pending', req.body.fileName),
                management: management
            });

            invalid.save()
                .then(() => res.status(201).json({ message: 'Document envoyé avec succès!' }))
                .catch(err => {
                    console.log(err);
                    res.status(500).json({
                        message: 'Une erreur est survenue'
                    });
                });
        } catch (error) {
            if (error.code === 'EEXIST'){
                return res.status(409).json({
                    message: 'Le fichier a déja été envoyé, renommez-le s\'il s\'agit d\'une autre version'
                });
            }
            console.log(error);
            return res.status(500).json({ message: 'Une erreur est survenue' });            
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Une erreur est survenue' });
    }
}
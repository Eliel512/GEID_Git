const Folder = require('../../models/archives/folder.model');
const Doc = require('../../models/archives/doc.model');

module.exports = (req, res, next) => {
    Folder.findOne({ name: req.body.folder })
        .then(async folder => {
            if(!req.body.folder){
                return res.status(400).json({ message: 'La cle \'folder\' est vide' });
            }
            if(!folder){
                // let docDesignation;
                // try{
                //     docDesignation = await Doc.findOne({ _id: req.body.doc });
                //     docDesignation = docDesignation.designation;
                // }catch(error){
                //     console.log(error);
                //     return res.status(500).json({ message: 'Une erreur est survenue' })
                // }
                const newFolder = Folder({
                    name: req.body.folder,
                    description: req.body.description
                });
                try{
                    await newFolder.save();
                }catch(error){
                    console.log(error);
                    return res.status(500).json({ message: 'Une erreur est survenue' });
                }
            }
            next();
        })
        .catch(error => {
            console.log(error);
            return res.status(500).json({ message: 'Une erreur est survenue' });
        });
};
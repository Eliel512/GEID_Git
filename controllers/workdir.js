const fs = require('fs');
const fsPromises = fs.promises;

exports.create = (req, res, next) => {
    fsPromises.mkdir(
        `${req.protocol}://${req.get('host')}/workspace/${req.body.userId}/${req.params.path}`,
        {
            recursive: true
        }
        )
        .then(res.status(201).json({ message: 'Dossier crée !' }))
        .catch(error => res.status(400).json({ error }));
};

exports.getOne = (req, res, next) => {
    const dirNFiles = {
        files: [],
        directories: []
    };
    fsPromises.readdir(`${req.protocol}://${req.get('host')}/workspace/${req.body.userId}/${req.params.path}`)
        .then(contents => {
            for(content of contents){
                if(~content.indexOf('.')){
                    dirNFiles['directories'].push(content);
                }else{
                    dirNFiles['files'].push(content);
                }
            }
            res.status(200).json(dirNFiles);
        })
        .catch(error => res.status(404).json({ error }));
};

exports.modify = (req, res, next) => {
    fsPromises.rename(
        `${req.protocol}://${req.get('host')}/workspace/${req.body.userId}/${req.params.path}`,
        `${req.protocol}://${req.get('host')}/workspace/${req.body.userId}/${req.params.dir}`
    )
    .then(res.status(200).json({ message: 'Dossier renommé !' }))
    .catch(error => res.status(400).json({ error }));
};

exports.delete = (req, res, next) => {
    fsPromises.rmdir(
        `${req.protocol}://${req.get('host')}/workspace/${req.body.userId}/${req.params.path}`,
        {
            recursive: true,
            maxRetries: 1
        }
    )
    .then(res.status(200).json({ message: 'Dossier supprimé !' }))
    .catch(error => res.status(400).json({ error }));
};
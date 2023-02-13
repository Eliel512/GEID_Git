const fs = require('fs');
const path = require('path');
const Invalid = require('../../models/archives/invalid.model');

module.exports = (req, res, next) => {
    Invalid.findOneAndDelete({ _id: req.params.id, management: res.locals.userId })
        .then(invalid => {
            if(!invalid){
                return res.status(400).json({ message: 'Opération impossible' });
            }
            try {
                fs.rmSync(path.join(__dirname, invalid.fileUrl), { force: true });
                Invalid.find({ management: res.locals.userId })
                    .then(invalids => res.status(200).json(invalids))
                    .catch(error => {
                        console.log(error);
                        res.status(500).json({
                            message: 'Erreur de rafraichissement, veuillez y procéder manuellement'
                        });
                    })
            } catch (error) {
                console.log(error);
                res.status(500).json({ message: 'Erreur lors de la suppression du fichier' });
            }            
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};
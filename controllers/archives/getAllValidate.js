const Archive = require('../../models/archives/archive.model');
const Profil = require('../../models/archives/profil.model');
const Folder = require('../../models/archives/folder.model');
const Retention = require('../../models/archives/retention.model');

module.exports = (req, res) => {
    const query = res.locals.structs.includes('all') ? {} : {
        administrativeUnit: { $in: res.locals.structs } };
    query.validated = true;

    Archive.find(query, { __v: 0 })
        .populate({
            path: 'folder',
            model: Folder,
            select: '_id name'
        })
        .populate({
            path: 'type.profil',
            model: Profil,
            select: '_id name privacy retention',
            populate: {
                path: 'retention',
                model: Retention,
                select: "_id name description delai arrangement"
            }
        })
        .then(archives => res.status(200).json(archives))
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};
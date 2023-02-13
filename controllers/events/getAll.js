const Event = require('../../models/archives/event.model');

module.exports = (req, res, next) => {
    Event.find({ })
        .then(events => {
            res.status(200).json(events);
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};
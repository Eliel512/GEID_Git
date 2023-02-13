const Event = require('../../models/archives/event.model');

module.exports = (req, res, next) => {
    Event.deleteOne({ _id: req.params.id })
        .then(() => {
            Event.find({ })
                .then(events => {
                    res.status(200).json(events);
                })
                .catch(error => {
                    console.log(error);
                    res.status(500).json({ message: 'Erreur de rafraichissement, veuillez y procéder manuellement' });
                });
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};
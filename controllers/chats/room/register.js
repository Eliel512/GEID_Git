// const callSession = require('../../../models/chats/callSession.model');
const Guest = require('../../../models/chats/guests.model');
const jwt = require('jsonwebtoken');


module.exports = (req, res) => {
    if(!req.body.name || typeof req.body.name !== 'string'){
        return res.status(400).json({ message: 'Champ \'name\' incorrect' });
    }
    const guest = new Guest({
        name: req.body.name
    });
    guest.save()
        .then(() => {
            return res.status(200).json({
                _id: guest._id,
                name: guest.name,
                token: jwt.sign({ _id: userId })
            });
        })
        .catch(error => {
            console.log(error);
            return res.status(500).json({ message: 'Une erreur est survenue' })
        });
}
// const callSession = require('../../../models/chats/callSession.model');
const Guest = require('../../../models/chats/guests.model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateId = (char) => {
    const uid = crypto.randomUUID();
    const hash = crypto.createHash('sha1').update(uid).digest('hex');
    return hash.slice(0, char);
};

module.exports = (req, res) => {
    if(!req.body.name || typeof req.body.name !== 'string'){
        console.log(req.body);
        return res.status(400).json({ message: 'Champ \'name\' incorrect' });
    }
    const userId = generateId(8);
    const guest = new Guest({
	    _id: userId,
        name: req.body.name
    });
    guest.save()
        .then(() => {
            return res.status(200).json({
                _id: guest._id,
                name: guest.name,
                token: jwt.sign(
                    { _id: guest._id },
                    process.env.TOKEN_KEY,
                    { expiresIn: '12h' })
            });
        })
        .catch(error => {
            console.log(error);
            return res.status(500).json({ message: 'Une erreur est survenue' })
        });
}

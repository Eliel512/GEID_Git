const callSession = require('../../../models/chats/callSession.model');
const Chat = require('../../../models/chats/chat.model');
const User = require('../../../models/users/user.model');

module.exports = async (req, res) => {
    callSession.findOne({ _id: req.params.id, 'participants.identity': res.locals.userId })
        .populate({
            path: 'location',
            model: Chat,
            select: '_id name description'
        })
        .populate({
            path: 'participants.identity',
            model: User,
            select: '_id fname lname mname email imageUrl grade'
        })
        .exec((error, callDetails) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ message: 'Une erreur est survenue' });
            }
            if (!callDetails) {
                return res.status(404).json({ message: 'Appel introuvable' });
            }
            res.status(200).json(callDetails);
        });
};
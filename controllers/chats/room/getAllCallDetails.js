const callSession = require('../../../models/chats/callSession.model');
const Chat = require('../../../models/chats/chat.model');
const User = require('../../../models/users/user.model');

module.exports = async (req, res) => {
    callSession.find({ 'participants.identity': res.locals.userId })
        .populate({
            path: 'location',
            model: Chat,
            select: '_id name description'
        })
        .populate({
            path: 'participants.identity',
            select: '_id name fname lname mname email imageUrl grade'
        })
        .exec((error, callDetails) => {
            if (error) {
                console.log(error);
                return res.status(500).json({ message: 'Une erreur est survenue' });
            }
            res.status(200).json(callDetails);
        });
};
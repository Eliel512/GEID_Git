const User = require('../models/user');
const Message = require('../models/message');
const { Space } = require('../models/space');
const Channel = require('../models/channel');

module.exports = {
    sendMessage: (req, res, next) => {
        const message = new Message({
            ...res.locals.message,
            sender: res.locals.userId
        });
        message.save()
            .then(() => res.status(201).json({ message: 'Message envoyé avec succès!' }))
            .catch(error => {
                console.log(error);
                res.status(400).json({ message: 'Une erreur est survenue!' })
            });
    },
    getMessages: (req, res, next) => {
        Message.find({
            recipient: res.locals.recipient
        }, { __v: 0,  })
            .then(messages => res.status(200).json(messages))
            .catch(() => res.status(400).json({ message: 'Une erreur est survenue!' }));
    },
    deleteMessage: (req, res, next) => {

    }
};
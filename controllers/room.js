const User = require('../models/user');
const Message = require('../models/message');
const Chat = require('../models/chat');
const Invitation = require('../models/invitation');
const updatesHandler = require('../handlers/updates');

module.exports = {
    createRoom: async (req, res) => {
        let { name, description, members } = req.body; 
        const userId = res.locals.user._id;

        if(!( name && description )){
            return res.status(400).json({ message: 'Le nom est la description sont requis.' });
        }

        if(5 > description.length){
            return res.status(400).json({
                message: 'La description doit contenir un minimum de 5 caractères.'
            })
        }

        if(!members || !Array.isArray(members)){
            return res.status(400).json({
                message: 'Un salon doit contenir au moins un membre hormis le créateur.'
            });
        }

        let userContacts = await User.findOne({ _id: userId }, { contacts: 1 });
        userContacts = userContacts.contacts;
        members = members.filter(member => userContacts.includes(member));

        if(!members.length){
            return res.status(400).json({
                message: 'Un salon doit contenir des membres de vos contacts'
            });
        }

        const room = new Chat({
            type: 'room',
            name: name,
            description: description,
            createdBy: userId,
            members: [{
                _id: userId,
                role: 'admin'
            },
                ...members.map(member => { 
                return {
                    _id: member,
                    role: 'simple'
                }
             })]
        });

        room.save()
          .then(() => {
            updatesHandler.newRoom(room._id);
            updatesHandler.updateChatsHistories(userId);
            res.status(201).json({ message: 'Salon créé avec succès!' });
          })
          .catch(err => {
            //console.log(err);
            res.status(400).json({ message: 'Certaines données semblent incorrectes.' });
          });
    },
    addMembers: async (req, res) => {
        const { members, roomId } = req.body;
        const userId = res.locals.user._id;

        if(!(members && roomId)){
            return res.status(400).json({ message: 'Les membres et l\'id du salon sont requis.' });
        }

        if(!Array.isArray(members)){
            return res.status(400).json({
                message: 'Une liste de membres à ajouter est requise.'
            });
        }

        let userContacts = await User.findOne({ _id: userId }, { contacts: 1 });
        userContacts = userContacts.contacts;
        members = members.filter(member => userContacts.includes(member));

        if(!members.length){
            return res.status(400).json({
                message: 'Vous ne pouvez ajouter que des membres de vos contacts.'
            });
        }

        const roomExists = await Chat.exists({
            _id: roomId, members: { $elemMatch: { _id: userId, role: 'admin' } }
        });

        if(!roomExists){
            return res.status(401).json({ message: 'Opération impossible.' });
        }

        Chat.updateOne({ _id: roomId }, { $push: { members: { $each: members } } })
          .then(() => {
              updatesHandler.updateChatHistory(roomId);
              res.status(200).json({ message: 'Membres ajoutés avec succès!' });
          })
          .catch(err => res.status(500).json({ message: 'Une erreur est survenue, veuillez réessayer.' }));

    },
    /*,
    sendMessage: (socket, messageObj, users) => {
        const { content } = messageObj;
        if(!content){
            socket.emit('error', {
                status: 400,
                message: 'Impossible d\'envoyer un message vide.'
            });
        }

        const message = new Message({
            content: content,
            ref: messageObj.ref,
            type: 'text',
            sender: socket.data.userId,
            recipient: socket.data.chatId,
            createdAt: messageObj.date
        });

        message.save()
            .then(() => {
                Chat.findOneAndUpdate({
                    _id: socket.data.chatId
                }, { $push: { messages: message._id } }, { useFindAndModify: false })
                    .then(chat => {

                        chat.members.forEach(member => {
                            if(member in users){

                                users[member].emit('newmsg', {
                                    chat: socket.data.chatId,
                                    sender: socket.data.userId
                                })
                            }
                        });
                        socket.emit('success', {
                        message: 'Message envoyé avec succès!'
                    });
                })
                    .catch(error => {
                        console.log(error);
                        socket.emit('error', {
                        status: 500,
                        message: 'Une erreur est survenue'
                    })
                });
            })
            .catch(error => {
                console.log(error);
                socket.emit('error', {
                    status: 500,
                    message: 'Une erreur est survenue, veuillez réessayer.'
                });
            });
    },
    readChat: async (socket, obj) => {
        const messages = [];
        try{
            chatMessages = await Chat.findOne({ _id: obj.chatId });
        //console.log(chatMessages.messages);
            for(msg of chatMessages.messages){
                const message = await Message.findOne({ _id: msg })
                messages.push(message);
            }

            socket.emit('msg', {
                messages: messages
            });

        }catch{
            socket.emit('error', {
                status: 400,
                message: 'Coordonnées du chat invalides.'
            })
        }
    },
    readChats: (socket) => {
        Chat.find({ members: socket.data.userId }, { __v: 0})
            .then(async chats => {
                const membs = [];
                const chatss = chats.map(chat => {
                    const r = {
                    _id: chat._id,
                    name: chat.name,
                    members: chat.members,
                    type: chat.type
                }
                return r;
            })

                for(chat of chatss){
                    const users = [];
                    for(member of chat.members){
                        try{
                            const user = await User.findOne({ _id: member }, { __v: 0, password: 0, joinedAt: 0 });
                            users.push(user);
                        }catch(error) {
                            console.log(error);
                            socket.emit('error', {
                                status: 500,
                                message: 'Une erreur est survenue, veuillez réessayer.'
                            });
                        }
                    }
                    chat.members = users;
                }
                socket.emit('chats', chatss)
            })
            .catch(error => {
                console.log(error);
                socket.emit('error', {
                    status: 400,
                    message: 'Une erreur est survenue, veuillez réessayer!'
                })
            });
    },
    readMessage: (socket, msg) => {
        Message.findOne()
          .then(msg => socket.emit('readed', {
            message: msg
          }))
          .catch(() => socket.emit('error', {
            status: 400,
            message: 'Les coordonnées du message semblent être invalides.'
          }));
    },
    createSpace: (socket, spaceObj) => {
        const { userId } = socket.data;
        const { name, description, members } = spaceObj;

        if(!( name || description )){
            socket.emit('error', {
                status: 400,
                message: 'Certaines données sont manquantes.'
            });
            return;
        }
        if(5 > description.length){
            socket.emit('error', {
                status: 400,
                message: 'La description doit contenir un minimum de 5 caractères.'
            });
            return;
        }

        const space = new Space({
            name: name,
            description: description,
            members: [{
                _id: userId,
                role: 'admin'
            },
                ...members.map(member => { 
                return {
                    _id: member,
                    role: 'simple'
                }
             })]
        });

        space.save()
            .then(() => socket.emit('spaceCreated', {
                space: space._id
            }))
            .catch(() => socket.emit('error', {
                status: 400,
                message: 'Certaines données semblent incorrectes.'
            }));
    }*/
};
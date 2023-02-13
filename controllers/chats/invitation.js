const User = require('../../models/users/user.model');
const Message = require('../../models/chats/message.model');
const Chat = require('../../models/chats/chat.model');
const Invitation = require('../../models/chats/invitation.model');
const updatesHandler = require('../../handlers/updates');

module.exports = {
    sendInvite: async (req, res) => {
        const { targetMail, object, details } = req.body;
        const objectsList = ['connexion', 'salon'];

        try {
            const userEmail = await User.findOne({ _id: res.locals.userId }, { email: 1 }).email;
            if (targetMail === userEmail) {
                res.status(409).json({
                    message: 'Vous ne pouvez pas envoyé d\'invitation à votre propre adresse.'
                });
            }
        } catch (error) {
            console.log(error);
            return res.status(500).json({ message: 'Une erreur est survenue' });
        }

        if(!object || typeof object !== 'string'){
            return res.status(400).json({
                message: 'Vous devez spécifié l\'objet de votre invitation'
            })
        }
        if(!objectsList.includes(object.toLowerCase())){
            return res.status(400).json({
                message: 'L\'objet de l\invitation est soit \'connexion\' soit \'salon\'.'
            });
        }

        User.findOne({ email: targetMail })
          .then(async targetUser => {
            if(!targetUser){
                return res.status(404).json({ message: 'Utilisateur introuvable' })
            }
            const userObj = await User.findOne({ _id: res.locals.userId });
            if(userObj.contacts.includes(targetUser._id.toString())){
                return res.status(409).json({
                    message: 'L\'utilisateur spécifié fait déjà parti de vos contacts.'
                });
            }
            const isInvitationAlreadySent = await Invitation.findOne({
                from: res.locals.userId,
                to: targetUser._id
            });
            if(isInvitationAlreadySent){
                return res.status(409).json({
                    message: 'Vous avez déjà envoyé une invitation à l\'utilisateur spécifié.'
                });
            }
            const invitation = new Invitation({
                from: res.locals.userId,
                to: targetUser._id,
                for: object,
                details: details
            });
            invitation.save()
              .then(() => {
                updatesHandler.updatePendingInvitations(invitation.to);
                res.status(201).json({ message: 'Invitation envoyé avec succès!' });
            })
              .catch(err => {
                console.log(err);
                res.status(500).json({
                    message: 'Une erreur est survenue, veuillez réssayer.'
                })
              });

          })
          .catch(() => res.status(404).json({ message: 'Utilisateur introuvable' }));
    },
    rejectInvite: async (req, res) => {
        const { _id } = req.body;
        const userId = res.locals.userId;
        const invitationExists = await Invitation.exists({ _id: _id, to: userId });
        if(invitationExists){
            Invitation.deleteOne({ _id: _id })
              .then(() => {
                res.status(200).json({ message: 'Invitation supprimée avec succès!' });
                updatesHandler.updatePendingInvitations(userId);
            })
              .catch(err => {
                console.log(err);
                res.status(500).json({ message: 'Une erreur est survenue, veuillez réessayer.' });
              });
        }else{
            res.status(400).json({ message: 'Invitation introuvable!' });
        }
    },
    acceptInvite: async (req, res) => {
        const { _id } = req.body;
        const receiverId = res.locals.userId;
        Invitation.findOne({ _id: _id, to: receiverId })
          .then(async invitation => {
                if(!invitation){
                    return res.status(400).json({ message: 'Invitation introuvable!' })
                }
                const { from, to } = invitation;
                try{
                    await User.updateOne({ _id: from }, { $push: { contacts: to } });
                    await User.updateOne({ _id: to }, { $push: { contacts: from } });
                    await Invitation.deleteOne({ _id: _id });
                    updatesHandler.updatePendingInvitations(to);
                    updatesHandler.updateContacts(from);
                    updatesHandler.updateContacts(to);
                    res.status(200).json({ message: 'Contact ajouté avec succès!' });
                }catch(err) {
                    console.error(err);
                    res.status(500).json({ message: 'Une erreur est survenue, veuillez réessayer.' });
                }
          })
          .catch(() => res.status(400).json({ message: 'Coordonnées de l\'invitation invalides.' }));
    },
    getInvite: async (req, res) => {
        const invits = await Invitation.find({ to: res.locals.userId })
        .populate('from', '_id email fname mname lname grade.grade grade.role', User);
        
        res.status(200).json(invits);
    }
    /*sendMessage: (socket, messageObj, users) => {
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
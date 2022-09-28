const serverStore = require('../serverStore');
const Message = require('../models/message');
const Chat = require('../models/chat');
const User = require('../models/user');
const { updatePendingInvitations, updateContacts, updateChatHistory, updateChatsHistories } = require('./updates');
const ErrorHandlers = require('./errors');
const { writeFileSync } = require('fs');

module.exports = {
    newConnectionHandler: async (socket, io) => {
        const userDetails = socket.user;
        serverStore.addNewConnectedUser({
            socketId: socket.id,
            userId: userDetails._id
        });
        socket.emit('connexion', {});
        updateContacts(/*socket.id,*/ userDetails._id);
        updatePendingInvitations(/*socket.id,*/ userDetails._id);
    },
    disconnectHandler: socket => {
        serverStore.removeConnectedUser(socket.id);
    },
    directMessageHandler: async (socket, data) => {
        const { to, content, date, ref, type } = data;
        const userId = socket.user._id;

        if(!content){
            return ErrorHandlers.msg(
                socket.id,
                'Impossible d\'envoyer un message vide.'
                )
        }

        let userContacts = await User.findOne({ _id: userId }, { contacts: 1 });
        userContacts = userContacts.contacts;
        if(!userContacts.includes(to)){
            return ErrorHandlers.msg(
                socket.id,
                'Cet utilisateur ne fait pas partie de vos contacts.'
                )
        }

        const message = new Message({
            content: content,
            sender: userId,
            type: type,
            createdAt: date,
            ref: ref
        });

        message.save()
          .then(() => {
            Chat.findOne({ "members._id": { $all: [userId, to] }, type: 'direct' })
              .then(chat => {
                if(chat){
                    chat.messages.push(message._id);
                    chat.save()
                      .then(() => updateChatHistory(chat._id.toString()))
                      .catch(err => {
                        ErrorHandlers.err(err, socket.id);
                    });
                }else{
                    newChat = new Chat({
                        members: [{
                          _id: userId,
                          role: 'simple'
                        }, {
                          _id: to,
                          role: 'simple'
                        }],
                        messages: [message._id],
                        type: 'direct'
                    });
                    newChat.save()
                      .then(() => updateChatHistory(newChat._id.toString()))
                      .catch(err => {
                        ErrorHandlers.err(err, socket.id);
                    });
                }

              })
              .catch(err => {
                ErrorHandlers.err(err, socket.id);
            });
          })
          .catch(err => {
            ErrorHandlers.err(err, socket.id);
        });
    },
    directChatHandler: (socket, data) => {
      const userId = socket.user._id;
        if(!data || !data.to){
          return updateChatsHistories(userId, socket.id);
        }
        const { to } = data;

        Chat.findOne({ "members._id": { $all: [userId, to] }, type: 'direct' })
          .then(chat => {
            if(chat){
                updateChatHistory(chat._id.toString(), socket.id);
            }
          })
          .catch(err => {
            ErrorHandlers.err(err, socket.id);
        });
    },
    roomMessageHandler: (socket, data) => {
      const { to, content, date, ref, type } = data;
        const userId = socket.user._id;

        if(!content){
            return ErrorHandlers.msg(
                socket.id,
                'Impossible d\'envoyer un message vide.'
                );
        }

        const message = new Message({
            content: content,
            sender: userId,
            type: type,
            createdAt: date,
            ref: ref
        });

        message.save()
          .then(() => {
            Chat.findOne({ _id: to, "members._id": userId, type: 'room' })
              .then(chat => {
                if(chat){
                    chat.messages.push(message._id);
                    chat.save()
                      .then(() => updateChatHistory(chat._id.toString()))
                      .catch(err => {
                        ErrorHandlers.err(err, socket.id);
                    });
                }else{
                  ErrorHandlers.msg(
                    socket.id,
                    'Salon introuvable.'
                    )
                }

              })
              .catch(err => {
                ErrorHandlers.err(err, socket.id);
            });
          })
          .catch(err => {
            ErrorHandlers.err(err, socket.id);
        });
    }
};
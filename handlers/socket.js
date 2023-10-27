const serverStore = require('../serverStore');
const Message = require('../models/chats/message.model');
const Chat = require('../models/chats/chat.model');
const User = require('../models/users/user.model');
const {
  updatePendingInvitations,
  updateContacts,
  updateChatHistory,
  updateChatsHistories,
  updateIncomingCalls,
  updateStatus,
  updateCallHistory
} = require('./updates');
const ErrorHandlers = require('./errors');
const { writeFileSync } = require('fs');
const errors = require('./errors');

const delay = time => {
  return new Promise(resolve => setTimeout(resolve, time));
}

module.exports = {
    newConnectionHandler: async (socket, io) => {
        const userDetails = socket.userId;
        serverStore.addNewConnectedUser({
            socketId: socket.id,
            userId: userDetails,
            socket: socket
        });
        socket.emit('connexion', {});
        updateContacts(/*socket.id,*/ userDetails);
        updatePendingInvitations(/*socket.id,*/ userDetails);
        updateStatus(socket.userId);
        updateCallHistory(userDetails);
    },
    disconnectHandler: socket => {
        const userId = socket.userId;
        User.updateOne({ _id: userId }, { $set: { connected_at: Date.now() } })
          .then(async () => {
            const receiverList = [];
            const userDetails = await User.findOne({ _id: userId }, { connected_at: 1, contacts: 1 });
            userDetails.contacts.forEach(contact => {
              receiverList.push(...serverStore.getActiveConnections(contact));
            });
            const io = serverStore.getSocketServerInstance();
            receiverList.forEach(socketId => {
              io.to(socketId).emit('status', {
                who: userId,
                status: userDetails.connected_at
              });
            });
          })
          .catch(error => {
            console.log(error);
            ErrorHandlers.msg(socket.id, 'Une erreur est survenue.');
          })
        serverStore.removeConnectedUser(socket.id);
    },
    directMessageHandler: async (socket, data) => {
        const { to, content, date, ref, type, clientId } = data;
        const userId = socket.userId;

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
            clientId: clientId,
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
      const userId = socket.userId;
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
      const { to, content, date, ref, type, clientId } = data;
        const userId = socket.userId;

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
            clientId: clientId,
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
    },
    pingHandler: async (socket, data) => {
      const { type, target } = data;
      switch(type){
        case 'direct':
          for(let i = 0; i < 20; i++){
            await delay(2000);
            socket.emit('rings', {
              status: serverStore.getActiveConnections(target).length > 0 ? 'connected' : 'not connected'
            });
          }
      }
    },
    lastHandler: async (socket, data) => {
      User.findById(socket.userId, 'connected_at')
        .then(user => {
          data = data ? data : {};
          user = user ? user : {};
          const date = data.date ? data.date : user.connected_at;
          Chat.find({ 'members._id': socket.userId, createdAt: { $gte: date } })
          .populate({
            path: 'messages',
            model: Message,
            populate: {
                path: 'sender',
                model: User,
                select: '_id fname lname mname email imageUrl'
            }
          })
          .populate({
            path: 'members._id',
            model: User,
              select: '_id fname lname mname email grade imageUrl'
          })
          .exec((err, chats) => {
            if(err){
                console.log(err);
                return ErrorHandlers.msg(socket.id, 'Une erreur est survenue');
            }
            const io = serverStore.getSocketServerInstance();
            io.to(socket.id).emit('last', chats);
            // socket.emit('last', chats);
          })
        })
        .catch(err => {
          console.log(err);
          ErrorHandlers.msg(socket.id, 'Une erreur est survenue');
        });
    },
    callHandler: async (socket, data) => {
      const userId = socket.userId;
      const { who, type, clientId } = data;
      const date = data.details?.date;
      const receiverList = [];
      let message;
      let targetSocketList;
      let roomDetails;
      let status;

      delete data.details?.date;
      let details = data.details ? data.details : { };
      details.mark = who;

      if(who.includes(userId)){
        return ErrorHandlers.msg(socket.id, 'Operation impossible');
      }

      switch (type) {
        case 'direct':
          const userDetails = await User.findOne({ _id: userId }, { contacts: 1 });
          if(!userDetails.contacts.includes(who[0])){
              return ErrorHandlers.msg(
                  socket.id,
                  'Cet utilisateur ne fait pas partie de vos contacts.'
                  )
          }

          targetSocketList = serverStore.getActiveConnections(who[0]);
          if (targetSocketList.length !== 0) {
            receiverList.push(...targetSocketList);
          }
          status = 0;
          break;

        case 'room':
          roomDetails = await Chat.findOne({ _id: who, 'members._id': userId, type: 'room' },
          { name: 1, 'members._id': 1 });

          if(!roomDetails){
            return ErrorHandlers.msg(socket.id, 'Lisanga introuvable')
          }

          details.members = [];
          
          roomDetails.members.forEach(member => {
            const memberId = member._id;
            if (memberId !== userId) {
              details.members.push(memberId);
              const targetSocketList = serverStore.getActiveConnections(memberId);
              if (targetSocketList.length !== 0) {
                receiverList.push(...targetSocketList);
              }
            }
          });

          status = {
            '0': [...roomDetails.members],
            '1': [],
            '2': [],
            '3': [],
            '4': []
          };

          delete roomDetails.members;
          break;

        default:
          return ErrorHandlers.msg(socket.id, '\'type\' incorrect');
      }

      const userDetails = await User.findById(userId, '_id fname mname lname email imageUrl');
      // message = new Message({
      //   content: `${userDetails.fname} ${userDetails.lname} a démarré un appel`,
      //   sender: userId,
      //   type: 'call',
      //   createdAt: date || new Date(),
      //   status: status,
      //   clientId: clientId,
      //   details: details
      // });

      const io = serverStore.getSocketServerInstance();

      message.save()
        .then(() => {
          receiverList.forEach(socketId => {
            io.to(socketId).emit('incoming-call', {
              from: userDetails,
              details: details,
              callId: message._id,
              room: roomDetails ? roomDetails : undefined 
            });
          });
          updateIncomingCalls(userId, who, type, message._id, 'call');
          
          Chat.findOne({ type: type }).or([{ _id: who } , { "members._id": { $all: [userId, who[0]] }}])
            .then(chat => {
              if(chat){
                  chat.messages.push(message._id);
                  chat.save()
                    .then(() => {
                      updateChatHistory(chat._id.toString());
                      chat.members.forEach(member => updateCallHistory(member._id));
                    })
                    .catch(err => {
                      ErrorHandlers.err(err, socket.id);
                  });
              }else{
                newChat = new Chat({
                  members: [{
                    _id: userId,
                    role: 'simple'
                  }, {
                    _id: who[0],
                    role: 'simple'
                  }],
                  messages: [message._id],
                  type: 'direct'
                });

                newChat.save()
                  .then(() => {
                    updateChatHistory(newChat._id.toString());
                    newChat.members.forEach(member => updateCallHistory(member._id));
                  })
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
    pickUpHandler: async (socket, data) => {
      const userId = socket.userId;
      const { from, type, callId } = data;
      const receiverList = [];
      let callDetails;
      let chatId;

      if (userId === from) {
        return ErrorHandlers.msg(socket.id, 'Operation impossible');
      }

      const userDetails = await User.findById(userId, '_id fname mname lname email imageUrl contacts');

      switch(type){
        case 'direct':
          if(!userDetails.contacts.includes(from)){
            return ErrorHandlers.msg(socket.id, 'Cet utilisateur ne fait pas partie de vos contacts.')
          }
          callDetails = await Message.findOne({ _id: callId, status: 0, sender: from, 'details.mark': userId, type: 'call' });
          if(!callDetails){
            return ErrorHandlers.msg(socket.id, 'Appel introuvable');
          }
          chatId = await Chat.findOne({ 'members._id': { $all: [from, userId] } }, { _id: 1 });
          chatId = chatId._id.toString();

          receiverList.push(...serverStore.getActiveConnections(from));
          updateCallHistory(from);
          callDetails.status = 1;
          break;

        case 'room':
          const roomDetails = await Chat.findOne({ _id: from, 'members._id': userId, type: 'room' }, { 'members._id': 1 });
          if(!roomDetails){
            ErrorHandlers.msg(socket.id, 'Lisanga introuvable');
          }
          callDetails = await Message.findOne({ _id: callId, 'details.mark': from, type: 'call' });
          if(!callDetails){
            return ErrorHandlers.msg(socket.id, 'Appel introuvable');
          }
          chatId = from;

          const userIndex = callDetails.status[0].indexOf(userId);
          callDetails.status[0].slice(userIndex, userIndex);

          callDetails.status[1].push(userId);
          callDetails.markModified('status');

          roomDetails.members.forEach(member => {
            const memberId = member._id;
            if(memberId !== userId){
              updateCallHistory(memberId);
              receiverList.push(...serverStore.getActiveConnections(memberId));
            }
          });
          break;

        default:
          return ErrorHandlers.msg(socket.id, '\'type\' incorrect');
      }
      
      const io = serverStore.getSocketServerInstance();
      receiverList.forEach(socketId => {
        io.to(socketId).emit('pick-up', {
          who: userDetails
        });
      });

      callDetails.save()
        .then(() => updateChatHistory(chatId))
        .catch(err => {
          ErrorHandlers.err(err, socket.id);
        })
      updateCallHistory(userId);

    },
  hangUpHandler: async (socket, data) => {
    const userId = socket.userId;
    const { from, type, details, callId } = data;
    const receiverList = [];
    let status = null;
    let callDetails;

    if (userId === from) {
      return ErrorHandlers.msg(socket.id, 'Operation impossible');
    }

    const userDetails = await User.findById(userId, '_id fname mname lname email imageUrl');
    switch(details.response){
      case 'unanswered':
        status = 0;
        break;
      case 'rejected':
        status = 0;
        break;
      case 'stop':
        status = 0;
        break;
      case 'end':
        status = 1;
        break;
    }

    switch (type) {
      case 'direct':
        receiverList.push(...serverStore.getActiveConnections(from));
        callDetails = await Message.findOne({
          _id: callId, status: status || 0,
          sender: details.response === 'stop' ? userId : from,
          'details.mark': details.response === 'stop' ? from : userId,
          type: 'call'
        });
        if (!callDetails) {
          return ErrorHandlers.msg(socket.id, 'Appel introuvable');
        }
        if(status != null){
          let chatId = await Chat.findOne({ 'members._id': { $all: [from, userId] }, type: 'direct' }, { _id: 1 });
          chatId = chatId._id.toString();
          callDetails.status = status === 1 ? 2 : details.response === 'rejected' ? 4 : 3;
          callDetails.save()
            .then(() => {
              setTimeout(() => updateChatHistory(chatId), 100);
            })
            .catch(err => {
              ErrorHandlers.err(err, socket.id);
            })
        }
        updateCallHistory(from);
        updateCallHistory(userId);
        break;

      case 'room':
        const roomDetails = await Chat.findOne({ _id: from, 'members._id': userId, type: 'room' }, { 'members._id': 1 });

        if (!roomDetails) {
          return ErrorHandlers.msg(socket.id, 'Lisanga introuvable');
        }

        callDetails = await Message.findOne({
          _id: callId,
          'details.mark': from,
          type: 'call'
        });

        if (!callDetails) {
          return ErrorHandlers.msg(socket.id, 'Appel introuvable');
        }

        if (status != null) {
          for(key in callDetails.status){
            if(callDetails.status[key].includes(userId)){
              const userIndex = callDetails.status[key].indexOf(userId);
              callDetails.status[key].slice(userIndex, userIndex);
              break;
            }
          }
          callDetails.status[status === 1 ? '2' : details.response === 'rejected' ? '4' : '3'].push(userId);
          callDetails.markModified('status');
          callDetails.save()
            .then(() => {
              setTimeout(() => updateChatHistory(from), 100);
            })
            .catch(err => {
              ErrorHandlers.err(err, socket.id);
            })
        }
        roomDetails.members.forEach(member => {

          const memberId = member._id;

          if(memberId !== userId){
            receiverList.push(...serverStore.getActiveConnections(memberId));
            updateCallHistory(memberId);
          }
        });
        //updateChatHistory(from);
        break;

      default:
        return ErrorHandlers.msg(socket.id, '\'type\' incorrect');
    }

    const io = serverStore.getSocketServerInstance();
    receiverList.forEach(socketId => {
      io.to(socketId).emit('hang-up', {
        who: userDetails,
        details: details || {}
      });
    });
  },
  signalHandler: async (socket, data) => {
    const userId = socket.userId;
    const { type, to, details } = data;
    const receiverList = [];
    switch(type){
      case 'direct':
        const userDetails = await User.findById(userId, 'contacts');
        if(!userDetails.contacts.includes(to)){
          ErrorHandlers.msg(socket.id, 'La cible ne figure pas dans vos contacts.')
        }
        receiverList.push(...serverStore.getActiveConnections(to));
        break;
      case 'room':
        const roomDetails = await Chat.findOne({ _id: to, 'members._id': userId, type: 'room' }, { 'members._id': 1 });
        roomDetails.members.forEach(member => {
          const memberId = member._id;
          if(memberId !== userId){
            receiverList.push(...serverStore.getActiveConnections(memberId));
          }
        });
        break;
      default:
        ErrorHandlers.msg(socket.id, '\'type\' incorrect');
    }

    const io = serverStore.getSocketServerInstance();
    receiverList.forEach(socketId => {
      io.to(socketId).emit('signal', {
        from: userId,
        details: details || {}
      });
    });
  },
  statusHandler: async (socket, data) => {
    //const userId = socket.userId;
    const { who } = data;
    let connected = true;
    let connected_at;

    if(serverStore.getActiveConnections(who).length === 0){
      const userDetails = await User.findOne({ _id: who }, { connected_at: 1 });
      connected_at = userDetails.connected_at;
      connected = false;
    }

    socket.emit('status', {
      who: who,
      status: connected ? 'online' : connected_at
    });
  }
};
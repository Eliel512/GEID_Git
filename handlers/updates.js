const serverStore = require('../serverStore');
const User = require('../models/user');
const Invitation = require('../models/invitation');
const Chat = require('../models/chat');
const Message = require('../models/message');
const ErrorHandlers = require('./errors');

module.exports = {
    updatePendingInvitations: (userId) => {
        Invitation.find({ to: userId })
          .populate('from', '_id lname mname fname email grade.grade grade.role', User)
          .exec((err, invitations) => {
            if(err){
                //return ErrorHandlers.err(err, socketId);
            }
            const receiverList = serverStore.getActiveConnections(userId);
            const io = serverStore.getSocketServerInstance();
            receiverList.forEach(socketId => {
                io.to(socketId).emit('invitations', {
                    invitations: invitations ? invitations : []
                });
            });
          });
    },
    updateContacts: (userId) => {
        User.findOne({ _id: userId }, { contacts: 1 })
         .populate('contacts', '_id fname mname lname email grade.grade grade.role', User)
         .exec((err, user) => {
            if(err){
                console.log(err);
                //return ErrorHandlers.err(err, socketId);
            }
            if(!user){
                /*return ErrorHandlers.msg(
                    socketId,
                    ''
                    )*/
            }
            const receiverList = serverStore.getActiveConnections(userId);
            const io = serverStore.getSocketServerInstance();
            receiverList.forEach(socketId => {
                io.to(socketId).emit('contacts', {
                    contacts: user.contacts ? user.contacts : []
                });
            });
         });
    },
    updateChatHistory: (chatId, toSpecifiedSocketId = null) => {
        Chat.findOne({ _id: chatId })
          .populate({
            path: 'messages',
            model: Message,
            populate: {
                path: 'sender',
                model: User,
                select: '_id fname lname mname email'
            }
          })
          .populate({
            path: 'members._id',
            model: User,
            select: '_id fname lname mname email grade'
          })
          .exec((err, chat) => {
            if(err){
                console.log(err);
                //return ErrorHandlers.err(err, socketId);
            }
            if(chat){
                const io = serverStore.getSocketServerInstance();
                if(toSpecifiedSocketId){
                    io.to(toSpecifiedSocketId).emit('direct-chat', {
                        messages: chat.messages,
                        members: chat.members
                    });
                    return;
                }
                chat.members.forEach(member => {
                    const activeConnections = serverStore.getActiveConnections(
                        member._id._id.toString()
                        );

                    activeConnections.forEach(socketId => {
                        io.to(socketId).emit('direct-chat', {
                            messages: chat.messages,
                            members: chat.members
                        });
                    });
                })
            }else{

            }
          });
    },
    updateChatsHistories: (userId) => {
        Chat.find({ "members._id": userId })
          .populate({
            path: 'messages',
            model: Message,
            populate: {
                path: 'sender',
                model: User,
                select: '_id fname lname mname email'
            }
          })
          .populate({
            path: 'members._id',
            model: User,
            select: '_id fname lname mname email grade'
          })
          .populate({
            path: 'createdBy',
            model: User,
            select: '_id fname lname mname email grade'
          })
          .exec((err, chats) => {
            if(err){
                console.log(err);
                //return ErrorHandlers.err(err, userSocketId);
            }
            if(chats){
                const io = serverStore.getSocketServerInstance();
                const activeConnections = serverStore.getActiveConnections(userId);

                activeConnections.forEach(socketId => {
                    io.to(socketId).emit('chats', {
                        chats: chats
                    });
                });
            }
          })
    },
    newRoom: (roomId) => {
        Chat.findOne({ _id: roomId })
          .populate({
            path: 'messages',
            model: Message,
            populate: {
                path: 'sender',
                model: User,
                select: '_id fname lname mname email'
            }
          })
          .populate({
            path: 'members._id',
            model: User,
            select: '_id fname lname mname email grade'
          })
          .populate({
            path: 'createdBy',
            model: User,
            select: '_id fname lname mname email grade'
          })
          .exec((err, chat) => {
            if(err){
                console.log(err);
                //return ErrorHandlers.err(err, socketId);
            }
            if(chat){
                const io = serverStore.getSocketServerInstance();
                /*if(toSpecifiedSocketId){
                    io.to(toSpecifiedSocketId).emit('direct-chat', {
                        messages: chat.messages,
                        members: chat.members
                    });
                    return;
                }*/
                chat.members.forEach(member => {
                    const activeConnections = serverStore.getActiveConnections(
                        member._id._id.toString()
                        );

                    activeConnections.forEach(socketId => {
                        io.to(socketId).emit('new-room', {
                            messages: chat.messages,
                            members: chat.members
                        });
                    });
                });
            
            }
        });   
    }
}
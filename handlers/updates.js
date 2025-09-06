const serverStore = require("../serverStore");
const User = require("../models/users/user.model");
const Invitation = require("../models/chats/invitation.model");
const Chat = require("../models/chats/chat.model");
const Message = require("../models/chats/message.model");
const ErrorHandlers = require("./errors");

module.exports = {
  updatePendingInvitations: (userId, type) => {
    Invitation.find({ to: userId })
      .populate(
        "from",
        "_id lname mname fname email grade.grade grade.role imageUrl",
        User
      )
      .exec((err, invitations) => {
        if (err) {
          //return ErrorHandlers.err(err, socketId);
        }
        const receiverList = serverStore.getActiveConnections(userId);
        const io = serverStore.getSocketServerInstance();
        receiverList.forEach((socketId) => {
          io.to(socketId).emit("invitations", {
            invitations: invitations ? invitations : [],
            type,
          });
        });
      });
  },
  updateContacts: (userId, contactOrigin) => {
    User.findOne({ _id: userId }, { contacts: 1 })
      .populate(
        "contacts",
        "_id fname mname lname email grade.grade grade.role imageUrl",
        User
      )
      .exec((err, user) => {
        if (err) {
          console.log(err);
          //return ErrorHandlers.err(err, socketId);
        }

        if (user) {
          //Please note, this part is edited by Vic-mtf
          const contactId = String(contactOrigin?.to || contactOrigin?.from);
          const contact = user.contacts?.find(
            ({ _id }) => contactId === _id.toString()
          );
          const contacts = contact ? [contact] : user?.contacts || [];
          const receiverList = serverStore.getActiveConnections(userId);
          const io = serverStore.getSocketServerInstance();
          receiverList.forEach((socketId) => {
            io.to(socketId).emit("contacts", { contacts, contactOrigin });
          });
        }
        /*return ErrorHandlers.msg(
                     socketId,
                     ''
                     )*/
      });
  },
  updateChatHistory: function (chatId, toSpecifiedSocketId = null) {
    Chat.findOne({ _id: chatId }, { __v: 0 })
      .populate({
        path: "messages",
        model: Message,
        options: {
          sort: { createdAt: -1 },
          limit: 1,
        },
        populate: {
          path: "sender",
          model: User,
          select: "_id fname lname mname email imageUrl",
        },
      })
      .populate({
        path: "members._id",
        model: User,
        select: "_id fname lname mname email grade imageUrl",
      })
      .exec((err, chat) => {
        if (err) {
          console.log(err);
          //return ErrorHandlers.err(err, socketId);
        }
        if (chat) {
          const io = serverStore.getSocketServerInstance();
          if (toSpecifiedSocketId) {
            io.to(toSpecifiedSocketId).emit("direct-chat", chat);
            return;
          }
          chat.members.forEach((member) => {
            const activeConnections = serverStore.getActiveConnections(
              member._id._id.toString()
            );

            activeConnections.forEach((socketId) => {
              io.to(socketId).emit("direct-chat", chat);
            });
          });
        } else {
        }
      });
  },
  updateChatsHistories: (userId, end = false) => {
    Chat.find({ "members._id": userId })
      .populate({
        path: "messages",
        model: Message,
        populate: {
          path: "sender",
          model: User,
          select: "_id fname lname mname email imageUrl",
        },
      })
      .populate({
        path: "members._id",
        model: User,
        select: "_id fname lname mname email grade imageUrl",
      })
      .populate({
        path: "createdBy",
        model: User,
        select: "_id fname lname mname email grade imageUrl",
      })
      .exec((err, chats) => {
        if (err) {
          console.log(err);
          //return ErrorHandlers.err(err, userSocketId);
        }
        if (chats) {
          const io = serverStore.getSocketServerInstance();
          const activeConnections = serverStore.getActiveConnections(userId);

          activeConnections.forEach((socketId) => {
            io.to(socketId).emit("chats", {
              chats: end ? [chats.findLast((el) => true)] : chats,
            });
          });
        }
      });
  },
  updateStatus: async (userId) => {
    const receiverList = [];
    const userDetails = await User.findOne({ _id: userId }, { contacts: 1 });
    userDetails.contacts.forEach((contact) => {
      receiverList.push(...serverStore.getActiveConnections(contact));
    });
    const io = serverStore.getSocketServerInstance();
    receiverList.forEach((socketId) => {
      io.to(socketId).emit("status", {
        who: userId,
        status: "online",
      });
    });
  },
  newRoom: (roomId) => {
    Chat.findOne({ _id: roomId })
      .populate({
        path: "messages",
        model: Message,
        populate: {
          path: "sender",
          model: User,
          select: "_id fname lname mname email grade imageUrl",
        },
      })
      .populate({
        path: "members._id",
        model: User,
        select: "_id fname lname mname email grade imageUrl",
      })
      .populate({
        path: "createdBy",
        model: User,
        select: "_id fname lname mname email grade imageUrl",
      })
      .exec((err, chat) => {
        if (err) {
          console.log(err);
          //return ErrorHandlers.err(err, socketId);
        }
        if (chat) {
          const io = serverStore.getSocketServerInstance();
          /*if(toSpecifiedSocketId){
                    io.to(toSpecifiedSocketId).emit('direct-chat', {
                        messages: chat.messages,
                        members: chat.members
                    });
                    return;
                }*/
          chat.members.forEach((member) => {
            const activeConnections = serverStore.getActiveConnections(
              member._id._id.toString()
            );

            activeConnections.forEach((socketId) => {
              io.to(socketId).emit("new-room", {
                messages: chat.messages,
                members: chat.members,
              });
            });
          });
        }
      });
  },
  updateIncomingCalls: async function (
    from,
    target,
    type,
    callId = null,
    action = null
  ) {
    const receiverList = serverStore.getActiveConnections(from);
    let targetIsConnected;
    switch (type) {
      case "direct":
        const targetSocketList = serverStore.getActiveConnections(target);
        if (targetSocketList.length !== 0) {
          //receiverList.push(...targetSocketList);
          targetIsConnected = true;
        } else if (action === "call") {
          const callDetails = await Message.findOne({
            _id: callId,
            status: 0,
            sender: from,
            "details.target": target,
            type: "call",
          });
          if (!callDetails) {
            return ErrorHandlers.msg(socket.id, "Une erreur est survenue");
          }
          let chatId = await Chat.findOne(
            { "members._id": { $all: [from, target] } },
            { _id: 1 }
          );
          chatId = chatId._id;
          callDetails.status = 2;
          callDetails
            .save()
            .then(() => this.updateChatHistory(chatId))
            .catch((err) => {
              ErrorHandlers.err(err, socket.id);
            });
        }
        break;
      case "room":
        const roomDetails = await Chat.findById(target, "members._id");
        roomDetails.members.forEach((member) => {
          const memberId = member._id;
          if (memberId !== from) {
            const memberSocketList = serverStore.getActiveConnections(memberId);
            if (memberSocketList.length !== 0) {
              //receiverList.push(...memberSocketList);
              targetIsConnected = true;
            }
          }
        });
        break;
    }
    const io = serverStore.getSocketServerInstance();
    receiverList.forEach((socketId) => {
      io.to(socketId).emit("call-in-progress", {
        connected: targetIsConnected ? true : false,
        callId: callId ? callId : undefined,
      });
    });
  },
  updateCallHistory: (userId) => {
    Message.find({
      type: "call",
      $or: [
        {
          sender: userId,
        },
        { "details.target": userId },
        { "details.members": userId },
      ],
    })
      .populate({
        path: "sender",
        model: User,
        select: "_id fname lname mname email grade imageUrl",
      })
      .exec((err, messages) => {
        if (err) {
          console.log(err);
        }
        if (messages) {
          const io = serverStore.getSocketServerInstance();
          const receiverList = serverStore.getActiveConnections(userId);

          receiverList.forEach((socketId) => {
            io.to(socketId).emit("call-history", [
              messages.findLast((msg) => true),
            ]);
          });
        }
      });
  },
};

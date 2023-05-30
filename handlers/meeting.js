const serverStore = require('../roomStore');
const User = require('../models/users/user.model');
const Invitation = require('../models/chats/invitation.model');
const Chat = require('../models/chats/chat.model');
const Message = require('../models/chats/message.model');
const ErrorHandlers = require('./errors');

module.exports = {
    updatePendingMeetings: (roomId, data) => {
        Chat.findOne({ _id: roomId, type: 'room' }, { members: 1 })
          .then(chat => {
              const io = serverStore.getSocketServerInstance();
              chat.members.forEach(member => {
                  const activeConnections = serverStore.getActiveConnections(
                      member._id.toString()
                  );
                  activeConnections.forEach(socketId => {
                      io.to(socketId).emit('schedule', data);
                  });
              })
          })
          .catch(error => {
            console.log(error);
          });
    }
};
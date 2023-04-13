const User = require('../../models/users/user.model');
const Chat = require('../../models/chats/chat.model');
const Message = require('../../models/chats/message.model');
const Invitation = require('../../models/chats/invitation.model');

module.exports = (req, res) => {
    const userId = res.locals.userId;
    
    Promise.all([
        Chat.find({ 'members._id': userId })
          .populate({
            path: 'messages',
            model: Message,
              populate: {
                  path: 'sender',
                  model: User,
                  select: '_id fname lname mname email grade imageUrl'
              }
          })
          .populate({
              path: 'members._id',
              model: User,
              select: '_id fname lname mname email grade imageUrl'
          })
          .populate({
              path: 'createdBy',
              model: User,
              select: '_id fname lname mname email grade imageUrl'
          }),
        User.findOne({ _id: userId }, { contacts: 1 })
          .populate({
            path: 'contacts',
            model: User,
            select: '_id fname mname lname email grade imageUrl'
          }),
        Invitation.find({  }).or([{ from: userId }, { to: userId }])
          .populate({
            path:'from',
            model: User,
            select: '_id fname mname lname email grade imageUrl'
          })
          .populate({
            path:'to',
            model: User,
            select: '_id fname mname lname email grade imageUrl'
          })
    ])
      .then(values => {
          res.status(200).json({
              chats: values[0],
              contacts: values[1].contacts,
              invitations: values[2]
          })
      })
      .catch(error => {
        console.log(error);
        res.status(500).json({ message: 'Une erreur est survenue' });
      });
};
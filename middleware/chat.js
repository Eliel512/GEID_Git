const User = require('../models/user');
const Chat = require('../models/chat');
const fs = require('fs');
const busboy = require('busboy');
const os = require('os');
const path = require('path');

/*
const isChannelMember = async (member, channelId) => {
    const channel = await Channel.findOne({ _id: channelId });
    return channel.members.includes(member);
};

const isSpaceMember = async (member, spaceId) => {
    const space = await Space.findOne({ _id: spaceId });
    return space.members.includes(member);  
};

const isSpaceChannel = async (channelId, spaceId) => {
    const space = await Space.findOne({ _id: spaceId });
    return space.channels.includes(channelId);
};
*/

module.exports = {
    check: async (req, res, next) => {
        let to, type, date, ref, filename;
        const userId = res.locals.userId;
        const bb = busboy({ headers: req.headers });
        bb.on('field', (name, val, info) => {
            if(`${name}` === 'to'){
                to = val;
            }else if(`${name}` === 'type'){
                type = val;
            }else if(`${name}` === 'date'){
                date = val;
            }else if(`${name}` === 'ref'){
                ref = val;
            }
          });
          /*bb.on('file', (name, file, info) => {
            console.log(name.);
            let construct = name.split('.');
            construct.pop();
            construct = construct.join('')+`${Date.now()}`;
            filename = construct.split(' ').join('_');
            const saveTo = path.join(os.tmpdir(), `salon/${filename}`);
            file.pipe(fs.createWriteStream(saveTo));
          });*/
          bb.on('close', async () => {
            let query;
            req.data = {
                to: to,
                date: date,
                type: type,
                ref: ref,
                filename: filename
            };
            switch(type){
                case 'direct':
                  let userContacts = await User.findOne({ _id: userId }, { contacts: 1 });
                  userContacts = userContacts.contacts;
                  if(!userContacts.includes(to)){
                      return res.status(404).json({
                          message: 'Cet utilisateur ne fait pas partie de vos contacts'
                      });
                  }
                  query = {
                    "members._id": { $all: [userId, to] },
                    type: 'direct'
                  };
                  break;
              
                case 'room':
                  const chatExists = await Chat.exists({
                    _id: to,
                    type: 'room',
                    "members._id": userId
                  });
                  if(chatExists){
                    query = {
                      "_id": to
                    };
                  }else{
                    return res.status(404).json({ message: 'Chat introuvable.' });
                  }
                  break;
              
                default:
                  return res.status(400).json({ message: '\'type\' incorrect.' })
              }
      
              if(new Date(date) == 'Invalid Date'){
                  return res.status(400).json({ message: 'La date est incorrecte.' });
              }
      
              Chat.findOne(query)
                .then(chat => {
                  if(chat){
                      req.chatId = chat._id.toString();
                      next();
                  }else{
                      const newChat = new Chat({
                          members: [{
                            _id: userId,
                            role: 'simple'
                          }, {
                            _id: to,
                            role: 'simple'
                          }],
                          type: 'direct'
                        });
      
                        newChat.save()
                          .then(() => {
                              req.chatId = newChat._id.toString();
                              next();
                          })
                          .catch(err => {
                            console.log(err);
                            res.status(500).json({ message: 'Une erreur est survenue. Veuillez réessayer.' });
                        });
                  }
                })
                .catch(err => {
                  console.log(err);
                  res.status(500).json({ message: 'Une erreur est survenue. Veuillez réessayer.' });
                });
          });
          req.pipe(bb);
    },
    getChat: async (socket, message) => {
        const { userId } = socket.data;
        const { chatId } = message;
        if(chatId){
            try {
                chat = await Chat.findOne({ _id: chatId });
                if(!chat){
                    socket.emit('error', {
                        status: 404,
                        message: 'Chat introuvable'
                    });
                }
                if(chat.members.includes(userId)){
                    socket.data.chatId = chat._id;
                    return true;
                }else{
                    socket.emit('error', {
                        status: 401,
                        message: 'L\'utilisateur ne fait pas partie de la discussion\''
                    });
                }
            }catch{
                socket.emit('error', {
                    status: 400,
                    message: 'Coordonnées du chat invalides'
                  })
            }
        }else if(socket.intent === 'send' && message.to){
            try {
                const msg = await Chat.findOne({ members: [userId, message.to] });
                if(msg){
                    socket.data.chatId = msg._id;
                    return true;
                }
            }catch{

            }
            socket.newChat = {
                create: true,
                type: 'direct',
                member: [userId, message.to]
            };
            return false;
        }else{
            socket.emit('error', {
                status: 400,
                message: 'Coordonnées du chat invalides'
            });
        }
    },
    createChat: async (socket) => {
        let name;
        if(socket.newChat.type === 'direct'){
            name = await User.findOne({ _id: socket.newChat.member[1] });
            name = name.lname.concat(' ', name.mname, ' ', name.fname);
        }else {
            name = socket.newChat.name;
        }
        const chat = new Chat({
            type: socket.newChat.type,
            name: name,
            description: socket.newChat.description,
            members: socket.newChat.member
        });
        try{
            await chat.save();
            socket.data.chatId = chat._id;
            delete socket.newChat;
            fs.mkdirSync(`salon/${chat._id}/`, { recursive: true });
            return true;
        }catch(error){
            console.log(error);
            socket.emit('error', {
                status: 500,
                message: 'Une erreur est survenue, veuillez réessayer!'
            } );
        }
    },

    createRoom: (socket, roomObj) => {
        socket.newChat = {
            create: true,
            type: 'room',
            name: roomObj.name,
            description: roomObj.description,
            member: [socket.data.userId, ...roomObj.members]
        };
        return socket;
    }
};
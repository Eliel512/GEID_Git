const User = require('../models/user');
const Space = require('../models/space');
const Chat = require('../models/chat');
const fs = require('fs');
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
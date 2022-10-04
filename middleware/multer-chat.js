const multer = require('multer');
const mime = require('mime-types');
const fs = require('fs');

const Chat = require('../models/chat');
const User = require('../models/user');

const getPath = async (userId, type, to) => {
  let query;
  switch(type){
    case 'direct':
      let userContacts = await User.findOne({ _id: userId }, { contacts: 1 });
      userContacts = userContacts.contacts;
      if(!userContacts.includes(to)){
          next(new Error('L\'Utilisateur ne figure pas dans les contacts'));
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
        next(new Error('Chat introuvable.'));
      }
      break;
  
    default:
      next(new Error('\'type\' incorrect.'));
  }
  try{
    chat = await Chat.findOne(query)
    if(chat){
      //req.chatId = chat._id;
      return "salon/"+chat._id;
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

      try{
        await newChat.save();
        //req.chatId = newChat._id;
        return "salon/"+newChat._id;
      }catch{
        console.log(err);
        throw 'Impossible de créer le chat.';
      }
    }
  }catch{
    throw 'Coordonnées du chat invalides';
  }
  
}


const storage = multer.diskStorage({
    destination: async (req, file, callback) => {
      const path = await getPath(req.userId, req.body.type, req.body.to);
      console.log(path);
      try{
        fs.accessSync(path, fs.constants.F_OK);
        callback(null, path);
      }catch{
        try{
          fs.mkdirSync(path, { recursive: true });
          callback(null, path);
        }catch(err){
          //console.log(err);
          throw 'Impossible de créer le dossier.'
        }
      }
    },
    filename: (req, file, callback) => {
      let construct = file.originalname.split('.');
      construct.pop();
      construct = construct.join('')+`${Date.now()}`;
      const name = construct.split(' ').join('_');
      const extension = mime.extension(file.mimetype);
      if(!extension){
        next(new Error('Invalid file type'));
      }
      /* + '.' + extension*/
      callback(null, name + '.' + extension);
    }
  });
  
  module.exports = multer({storage: storage}).single('file');
const multer = require('multer');
const mime = require('mime-types');
const fs = require('fs');
const pathModule = require('path');
const minioStorage = require('../tools/storage');

const Chat = require('../models/chats/chat.model');
const User = require('../models/users/user.model');

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


const diskStorage = multer.diskStorage({
    destination: async (req, file, callback) => {
      const path = await getPath(req.userId, req.body.type, req.body.to);
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
      construct = construct.join('')+`-${Date.now()}`;
      const name = construct/*.split(' ').join('_')*/;
      const extension = mime.extension(file.mimetype);
      if(!extension){
        next(new Error('Invalid file type'));
      }
      /* + '.' + extension*/
      callback(null, name + '.' + extension);
    }
  });

const upload = multer({storage: diskStorage}).single('file');

// Wrap multer to also upload to MinIO after disk write
module.exports = (req, res, next) => {
    upload(req, res, (err) => {
        if (err) return next(err);
        if (req.file) {
            // req.file.destination is like "salon/<chatId>"
            const relPath = pathModule.join(req.file.destination, req.file.filename);
            minioStorage.uploadFileFromDisk(relPath, req.file.path).catch(err2 => {
                console.error('[MinIO upload] multer-chat:', err2.message);
            });
        }
        next();
    });
};

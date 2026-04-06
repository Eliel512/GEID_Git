const multer = require('multer');
const mime = require('mime-types');
const storage = require('../tools/storage');

const Chat = require('../models/chats/chat.model');
const User = require('../models/users/user.model');

const getPath = async (userId, type, to) => {
  let query;
  switch(type){
    case 'direct':
      let userContacts = await User.findOne({ _id: userId }, { contacts: 1 });
      userContacts = userContacts.contacts;
      if(!userContacts.includes(to)){
          throw new Error('L\'Utilisateur ne figure pas dans les contacts');
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
        query = { "_id": to };
      }else{
        throw new Error('Chat introuvable.');
      }
      break;

    default:
      throw new Error('\'type\' incorrect.');
  }

  let chat = await Chat.findOne(query);
  if(chat){
    return "salon/" + chat._id;
  }

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

  await newChat.save();
  return "salon/" + newChat._id;
};

const memStorage = multer.memoryStorage();
const upload = multer({ storage: memStorage }).single('file');

module.exports = (req, res, next) => {
  upload(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next();

    try {
      const chatPath = await getPath(req.userId, req.body.type, req.body.to);

      let construct = req.file.originalname.split('.');
      construct.pop();
      construct = construct.join('') + `-${Date.now()}`;
      const extension = mime.extension(req.file.mimetype);
      if (!extension) {
        return res.status(400).json({ message: 'Type de fichier non reconnu.' });
      }
      const filename = construct + '.' + extension;
      const relativePath = chatPath + '/' + filename;

      req.file.filename = filename;
      req.file.destination = chatPath;

      await storage.uploadFile(relativePath, req.file.buffer);
    } catch (err2) {
      console.error('[MinIO upload] multer-chat:', err2.message);
      return res.status(500).json({ message: err2.message });
    }

    next();
  });
};

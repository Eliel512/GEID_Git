const multer = require('multer');
const mime = require('mime-types');
const fs = require('fs');

const Chat = require('../models/chat');

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        Chat.findOne({ "members._id": { $all: [req.userId, req.body.to] }, type: 'direct' })
            .then(chat => {
                if(chat){
                    const path = "salon/"+chat._id;
                    try{
                      fs.accessSync(path, fs.constants.F_OK);
                    }catch{
                      try{
                        fs.mkdirSync(`${path}`, { recursive: true });
                      }catch(err){
                        console.log(err);
                        throw 'Impossible de créer le dossier.'
                      }
                    }finally{
                      callback(null, path);
                    }
                }else{
                    newChat = new Chat({
                      members: [{
                        _id: req.userId,
                        role: 'simple'
                      }, {
                        _id: req.body.to,
                        role: 'simple'
                      }],
                      type: 'direct'
                    });

                    newChat.save()
                      .then(() => {
                        const path = "salon/"+newChat._id;
                        callback(null, path);
                      })
                      .catch(err => {
                        console.log(err);
                        throw 'Impossible de créer le chat.';
                    });
                }
            })
            .catch(() => {
              throw 'Coordonnées du chat invalides'
            });
    },
    filename: (req, file, callback) => {
      let construct = file.originalname.split('.');
      construct.pop();
      construct = construct.join('')+`${Date.now()}`;
      const name = construct.split(' ').join('_');
      const extension = mime.extension(file.mimetype);
      if(!extension){
        throw 'Invalid file type';
      }
      /* + '.' + extension*/
      callback(null, name + '.' + extension);
    }
  });
  
  module.exports = multer({storage: storage}).single('file');
const User = require('../models/user');
const Message = require('../models/message');
const Chat = require('../models/chat');
const { updateChatHistory } = require('../handlers/updates');
const getHost = require('./getHost').getHost();

module.exports = {
    sendDirectFile: async (req, res) => {
        const userId = res.locals.userId;
        const to = req.body.to;

        let userContacts = await User.findOne({ _id: userId }, { contacts: 1 });
        userContacts = userContacts.contacts;
        if(!userContacts.includes(to)){
            return res.status(404).json({
                message: 'Cet utilisateur ne fait pas partie de vos contacts'
            });
        }

        if(new Date(req.body.date) == 'Invalid Date'){
            return res.status(400).json({ message: 'La date est incorrecte.' });
        }

        Chat.findOne({ "members._id": { $all: [userId, to] }, type: 'direct' })
          .then(chat => {
            if(chat){
              const content = `${req.protocol}s://${getHost}/salon/${chat._id}/${req.file.filename}`;
              const message = new Message({
                content: content,
                ref: req.body.ref,
                type: 'file',
                sender: userId,
                createdAt: req.body.date
              });
              message.save()
                .then(() => {
                  chat.messages.push(message._id);
                  chat.save()
                    .then(() => {
                      updateChatHistory(chat._id.toString());
                      res.status(201).json({ message: 'Fichier envoyé avec succès!' });
                  })
                    .catch(err => {
                      console.log(err);
                      res.status(500).json({ message: 'Une erreur est survenur, veuillez réessayer.' })
                  });
                })
                .catch(error => {
                  console.log(error);
                  res.status(500).json({ message: 'Une erreur est survenur, veuillez réessayer.' });
                });
            }else{
              const newChat = new Chat({
                members: [{
                  _id: userId,
                  role: 'simple'
                }, {
                  _id: to,
                  role: 'simple'
                }],
                messages: [],
                type: 'direct'
              });
              const content = `${req.protocol}s://${getHost}/salon/${newChat._id}/${req.file.filename}`;
              const message = new Message({
                content: content,
                ref: req.body.ref,
                type: 'file',
                sender: userId,
                createdAt: req.body.date
              });
              message.save()
                .then(() => {
                  chat.messages.push(message._id);
                  chat.save()
                    .then(() => {
                      updateChatHistory(chat._id.toString());
                      res.status(201).json({ message: 'Fichier envoyé avec succès!' });
                  })
                    .catch(err => {
                      console.log(err);
                      res.status(500).json({ message: 'Une erreur est survenur, veuillez réessayer.' })
                  });
                })
                .catch(err => {
                  console.log(err);
                  res.status(500).json({ message: 'Une erreur est survenue, veuillez réessayer' });
                });
            }
          })
          .catch(err => {
            console.log(err);
            res.status(500).json({ message: 'Une erreur est survenue, veuillez réessayer.' });
          });
    },
    sendFile: async (req, res) => {
      const userId = res.locals.userId;
      const to = req.body.to;
      let query;
      switch(req.body.type){
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
            _id: req.body.to,
            type: 'room',
            "members._id": userId
          });
          if(chatExists){
            query = {
              "_id": req.body.to
            };
          }else{
            return res.status(404).json({ message: 'Chat introuvable.' });
          }
          break;
        
        default:
          return res.status(400).json({ message: '\'type\' incorrect.' })
      }

      if(new Date(req.body.date) == 'Invalid Date'){
          return res.status(400).json({ message: 'La date est incorrecte.' });
      }
      Chat.findOne(query)
        .then(chat => {
          if(chat){
            const content = `${req.protocol}s://${getHost}/salon/${chat._id}/${req.file.filename}`;
            const message = new Message({
              content: content,
              ref: req.body.ref,
              type: 'file',
              sender: userId,
              createdAt: req.body.date
            });
            message.save()
              .then(() => {
                chat.messages.push(message._id);
                chat.save()
                  .then(() => {
                    updateChatHistory(chat._id.toString());
                    res.status(201).json({ message: 'Fichier envoyé avec succès!' });
                })
                  .catch(err => {
                    console.log(err);
                    res.status(500).json({ message: 'Une erreur est survenur, veuillez réessayer.' })
                });
              })
              .catch(error => {
                console.log(error);
                res.status(500).json({ message: 'Une erreur est survenur, veuillez réessayer.' });
              });
          }else{
            res.status(500).json({ message: 'Une erreur est survenue, veuillez réessayer.' })
          }
        })
        .catch(err => {
          console.log(err);
          res.status(500).json({ message: 'Une erreur est survenue, veuillez réessayer.' });
        });

    },
    rejectInvite: async (req, res) => {},
    acceptInvite: async (req, res) => {},
    getInvite: async (req, res) => {}
};
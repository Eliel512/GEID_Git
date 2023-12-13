// const session = require('express-session');
// const sharedsession = require('express-socket.io-session');
// const mongoose = require('mongoose');
// const MongoStore = require('connect-mongo');
// const CallSession = require('./models/chats/callSession.model');
const eiows = require('eiows');
const auth = require('./middleware/socketAuth');
const socketHandler = require('./handlers/socket');
const roomHandler = require('./handlers/room');
const serverStore = require('./serverStore');
const roomStore = require('./roomStore');
const { updateContacts, updateCallHistory } = require('./handlers/updates');

const registerSocketServer = server => {
  const { Server } = require('socket.io');
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ["GET", "POST"]
    },
    wsEngine: eiows.Server
  });

  // const roomIo = io.of('/room');

  // const store = MongoStore.create({
  //   client: mongoose.connection.getClient(), // Utiliser le client mongoose existant
  //   collectionName: CallSession.collection.name, // Nom de la collection pour les sessions
  //   modelName: CallSession.modelName, // Nom du modèle mongoose pour les sessions
  //   stringify: false, // Ne pas convertir la session en chaîne JSON
  //   ttl: 60 * 60 * 24 // 1 Jour
  // });

  // store.on('error', function (error) {
  //   console.error(error);
  // });

  // const sessionMiddleware = session({
  //   secret: process.env.SESSION_SECRET,
  //   cookie: {
  //     maxAge: 1000 * 60 * 60 * 24, // La durée de vie du cookie de session en millisecondes
  //     secure: true // Activer le cookie sécurisé si vous utilisez HTTPS
  //   },
  //   store: store, // L'objet de stockage de session MongoDB
  //   resave: false, // Force la sauvegarde de la session à chaque requête
  //   saveUninitialized: false // Force la création d'une session même si elle est vide
  // });

  serverStore.setSocketServerInstance(io);
  // roomStore.setSocketServerInstance(io);

  io.use(auth)
    .on('connection', (socket) => {

      socketHandler.newConnectionHandler(socket, io);

      socket.on('direct-message', data => {
        socketHandler.directMessageHandler(socket, data);
      });

      socket.on('direct-file', data => {
        socketHandler.directFileHandler(socket, data);
      });

      socket.on('direct-chat', data => {
        socketHandler.directChatHandler(socket, data);
      });

      socket.on('room-message', data => {
        socketHandler.roomMessageHandler(socket, data);
      });

      socket.on('call-message', data => {
        roomHandler.callMessageHandler(socket, data);
      });

      // socket.on('ping', data => {
      //   socketHandler.pingHandler(socket, data);
      // });

      socket.on('contacts', () => {
        updateContacts(socket.userId);
      });

      socket.on('last', () => {
        socketHandler.lastHandler(socket.userId);
      });

      socket.on('call', data => {
        socketHandler.callHandler(socket, data);
      });

      socket.on('call-history', () => {
        updateCallHistory(socket);
      });

      socket.on('pick-up', data => {
        socketHandler.pickUpHandler(socket, data);
      });

      // socket.on('hang-up', data => {
      //   socketHandler.hangUpHandler(socket, data);
      // });

      // socket.on('signal', data => {
      //   socketHandler.signalHandler(socket, data);
      // });

      socket.on('status', data => {
        socketHandler.statusHandler(socket, data);
      });

      // 

      socket.on('ping', (data, callback) => {
        // socket.emit('ping', 'ping');
        callback('C\'est bon');
      });

      socket.on('schedule', data => {
        roomHandler.scheduleHandler(socket, data);
      });

      socket.on('create', data => {
        roomHandler.createHandler(socket, data);
      });

      socket.on('join', data => {
        roomHandler.joinRoom(socket, data);
      });

      socket.on('accept', data => {
        roomHandler.accept(socket, data);
      });

      socket.on('leave', data => {
        roomHandler.leaveRoom(socket, data);
      });

      socket.on('edit-room', data => {
        roomHandler.edit(socket, data);
      });

      socket.on('signal', data => {
        roomHandler.signal(socket, data);
      });

      // socket.on('call', data => {
      //   roomHandler.callHandler(socket, data);
      // });

      socket.on('ringing', data => {
        roomHandler.ringHandler(socket, data);
      });

      socket.on('busy', data => {
        roomHandler.busyHandler(socket, data);
      });

      socket.on('hang-up', (data, callback) => {
        roomHandler.hangUpHandler(socket, data);
        // callback('C\'est bon');
      });

      socket.on('disconnect', () => {
        socketHandler.disconnectHandler(socket);
      });


    });

  // roomIo.use(auth)
  //   //.use(sharedsession(sessionMiddleware))
  //   .on('connection', socket => {
  //     socketHandler.newConnectionHandler(socket, roomIo);

  //     roomStore.addNewConnectedUser({
  //       socketId: socket.id,
  //       userId: socket.userId,
  //       socket: socket
  //     });

  //     socket.on('ping', (data, callback) => {
  //       socket.emit('ping', 'ping');
  //       callback('C\'est bon');
  //     });

  //     socket.on('schedule', data => {
  //       roomHandler.scheduleHandler(socket, data);
  //     });

  //     socket.on('create', data => {
  //       roomHandler.createHandler(socket, data);
  //     });

  //     socket.on('join', data => {
  //       roomHandler.joinRoom(socket, data);
  //     });

  //     socket.on('leave', data => {
  //       roomHandler.leaveRoom(socket, data);
  //     });

  //     socket.on('signal', data => {
  //       roomHandler.signal(socket, data);
  //     });

  //     socket.on('call', data => {
  //       roomHandler.callHandler(socket, data);
  //     });

  //     socket.on('ringing', data => {
  //       roomHandler.ringHandler(socket, data);
  //     });

  //     socket.on('busy', data => {
  //       roomHandler.busyHandler(socket, data);
  //     });

  //     socket.on('hang-up', (data, callback) => {
  //       roomHandler.hangUpHandler(socket, data);
  //       callback('C\'est bon');
  //     });

  //     // socket.on('disconnect', () => {
  //     //   roomHandler.disconnectHandler(socket);
  //     // });

  //   });
}

module.exports = { registerSocketServer };
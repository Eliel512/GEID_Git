const auth = require('./middleware/socketAuth');
const socketHandler = require('./handlers/socket');
const serverStore = require('./serverStore');
const { updateContacts } = require('./handlers/updates');

const registerSocketServer = server => {
  const { Server } = require('socket.io');
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ["GET", "POST"]
    }
  });

  serverStore.setSocketServerInstance(io);

  io.use(auth)
    .on('connection', (socket) => {
      
      socketHandler.newConnectionHandler(socket, io);

      socket.on('direct-message', data => {
        socketHandler.directMessageHandler(socket, data);
      });

      socket.on('direct-file', (data, callback) => {
        socketHandler.directFileHandler(socket, data);
      });

      socket.on('direct-chat', data => {
        socketHandler.directChatHandler(socket, data);
      });

      socket.on('room-message', data => {
        socketHandler.roomMessageHandler(socket, data);
      });

      socket.on('contacts', () => {
        updateContacts(socket.userId);
      });

      socket.on('disconnect', () => {
        socketHandler.disconnectHandler(socket);
      });

    });

}

module.exports = { registerSocketServer };

/*const server = require('./server');
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ["GET", "POST"],
    credentials: true,
    transports: ['websocket', 'polling'],
  },
  allowEIO3: true
});

const auth = require('./middleware/socketAuth');
const { getChat, createChat, createRoom } = require('./middleware/chat');
const { sendMessage, createSpace, readChat, readChats } = require('./controllers/chat');

const users = {};

io.use(auth)
  .on('connection', (socket) => {

    users[socket.data.userId] = socket;

    console.log(`connected users: ${ Object.keys(users).join(' ') }`);

    socket.emit('connexion', {
      message: 'Connecté'
    });

    socket.on('sendMessage', async message => {
        socket.intent = 'send';
        const chatTest = await getChat(socket, message);
        if(chatTest === true){
            sendMessage(socket, message, users);
            console.log('Message sended');
        }else if (chatTest === false && message.to) {
            const createTest = await createChat(socket);
            if(createTest === true){
                sendMessage(socket, message, users);
                console.log('Message sended');
            }
        }

      });
    
    socket.on('readChats', () => {
        readChats(socket);
    });

    socket.on('readChat', chatId => {
      readChat(socket, chatId);
    });

    socket.on('readMessage', message => {
        readMessage(socket, message);
    });

    socket.on('createSpace', async space => {
        socket.intent = 'crtSp';
        console.log('Creating space...');
        createSpace(socket, space);
    });

    socket.on('nwroom', async roomObj => {
      const createTest = await createChat(
        createRoom(socket, roomObj)
      );
      if(createTest === true){
        socket.emit('success', {
          message: 'Discussion créée avec succès!'
        })
        socket.emit('nwchat');
      }else{
        socket.emit('error', {
          status: 400,
          message: 'Une erreur est survenue, veuillez vérifier les informations entrées.'
        })
      }
    });

    socket.on('nwchat', () => socket.emit('readChats'))

    socket.on('disconnect', () => {
      console.log(`${socket.data.userId} disconnected`);
    });
  });
  */
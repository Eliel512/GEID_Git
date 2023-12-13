const jwt = require('jsonwebtoken');
const serverStore = require('../serverStore');

module.exports = (socket, next) => {
    if (socket.handshake.query && socket.handshake.query.token){
        jwt.verify(socket.handshake.query.token, process.env.TOKEN_KEY, function(err, decoded) {
          if (err) {
            return next(new Error('Authentication error'));
          }
          socket.userId = decoded._id;
          next();
        });
    }
      else {
        next(new Error('Authentication error'));
      }
};
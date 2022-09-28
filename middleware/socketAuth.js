const jwt = require('jsonwebtoken');

module.exports = (socket, next) => {
    if (socket.handshake.query && socket.handshake.query.token){
        jwt.verify(socket.handshake.query.token, 'RANDOM_TOKEN_SECRET', function(err, decoded) {
          if (err) return next(new Error('Authentication error'));
          socket.user = decoded.user;
          next();
        });
      }
      else {
        next(new Error('Authentication error'));
      }
};
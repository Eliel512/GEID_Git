const serverStore = require('../serverStore');

module.exports = {
    err: (err, socketId) => {
        console.log(err);
        const io = serverStore.getSocketServerInstance();
        io.to(socketId).emit('error', {
            message: 'Une erreur est survenue, veuillez réessayer.'
        });
    },
    msg: (socketId, msg) => {
        const io = serverStore.getSocketServerInstance();
        io.to(socketId).emit('error', {
            message: msg
        });
    }
}
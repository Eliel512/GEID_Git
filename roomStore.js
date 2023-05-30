const connectedUsers = new Map();

let io = null;

module.exports = {
    setSocketServerInstance: ioInstance => {
        io = ioInstance;
    },
    getSocketServerInstance: () => {
        return io;
    },
    addNewConnectedUser: ({ socketId, userId }) => {
        connectedUsers.set(socketId, { userId });

        //console.log('Connected users');
        //console.log(connectedUsers);
    },
    removeConnectedUser: socketId => {
        if (connectedUsers.has(socketId)) {
            connectedUsers.delete(socketId);
        }
    },
    getActiveConnections: userId => {
        const activeConnections = [];
        connectedUsers.forEach((value, key) => {
            if (value.userId === userId) {
                activeConnections.push(key);
            }
        })
        return activeConnections;
    }
};
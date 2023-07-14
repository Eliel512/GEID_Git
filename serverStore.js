const connectedUsers = new Map();

let io = null;

module.exports = {
    setSocketServerInstance: ioInstance => {
        io = ioInstance;
    },
    getSocketServerInstance: () => {
        return io;
    },    
    addNewConnectedUser: ({ socket, socketId, userId }) => {
        connectedUsers.set(socketId, {
            userId: userId,
            socket: socket
        });
    
        // console.log(userId);
        // console.log(connectedUsers);
    },
    removeConnectedUser: socketId => {
        if(connectedUsers.has(socketId)){
            connectedUsers.delete(socketId);
        }
    },
    getActiveConnections: userId => {
        const activeConnections = [];
        connectedUsers.forEach((value, key) => {
            if(value.userId == userId){
                activeConnections.push(key);
            }
        })
        return activeConnections;
    },
    getUserSocketInstance: userId => {
        const result = {};
        result.add = function (key, value) {
            this[key] = value;
        };
        connectedUsers.forEach((value, key) => {
            // console.log(value.userId, userId);
            if (value.userId === userId) {
                result.add('socket', value.socket);
            }
        });
        delete result.add;
        return result;
    }
};
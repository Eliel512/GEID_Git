/**
 * roomStore.js — Store en mémoire des connexions pour les salles d'appel (process local)
 *
 * Variante de serverStore.js dédiée aux salles d'appel (rooms).
 * Stocke les participants connectés pour le process courant uniquement.
 *
 * Note : pour une architecture multi-process (PM2 fork), préférer
 * socketStore.js qui s'appuie sur Redis pour partager l'état entre workers.
 */

/** Map socketId → { userId, socket } pour les participants des salles */
const connectedUsers = new Map();

/** Instance Socket.io de ce worker */
let io = null;

module.exports = {
  /**
   * Enregistre l'instance Socket.io du serveur.
   * @param {import('socket.io').Server} ioInstance
   */
  setSocketServerInstance: (ioInstance) => {
    io = ioInstance;
  },

  /**
   * Retourne l'instance Socket.io du serveur.
   * @returns {import('socket.io').Server|null}
   */
  getSocketServerInstance: () => {
    return io;
  },

  /**
   * Ajoute un participant connecté dans la map locale.
   * @param {{ socket: import('socket.io').Socket, socketId: string, userId: string }} param
   */
  addNewConnectedUser: ({ socket, socketId, userId }) => {
    connectedUsers.set(socketId, {
      userId: userId,
      socket: socket,
    });
  },

  /**
   * Supprime un participant déconnecté de la map locale.
   * @param {string} socketId
   */
  removeConnectedUser: (socketId) => {
    if (connectedUsers.has(socketId)) {
      connectedUsers.delete(socketId);
    }
  },

  /**
   * Retourne tous les socketIds actifs pour un userId donné.
   * @param {string} userId
   * @returns {string[]}
   */
  getActiveConnections: (userId) => {
    const activeConnections = [];
    connectedUsers.forEach((value, _key) => {
      if (value.userId === userId) {
        activeConnections.push(_key);
      }
    });
    return activeConnections;
  },

  /**
   * Retourne l'objet socket associé à un userId (dernier socket trouvé).
   * @param {string} userId
   * @returns {{ socket?: import('socket.io').Socket }}
   */
  getUserSocketInstance: (userId) => {
    const result = {};
    result.add = function (key, value) {
      this[key] = value;
    };
    connectedUsers.forEach((value, _key) => {
      if (value.userId === userId) {
        result.add("socket", value.socket);
      }
    });
    delete result.add;
    return result;
  },
};

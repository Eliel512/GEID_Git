const parseClientInfo = require("./tools/parseClientInfo");

/**
 * @typedef {Object} ClientInfo
 * @property {string} socketId
 * @property {string} clientId
 * @property {import('socket.io').Socket} socketClientInstance
 * @property {{
 *   userAgent: string,
 *   device: string,
 *   browser: string,
 *   os: string,
 *   connectionDate: string
 * }} infos
 */

/** @class */
class SocketStore {
  /** @type {import('socket.io').Server|null} */
  #io = null;

  /** @type {ClientInfo} */
  #clients = {};

  /**
   * @param {import('socket.io').Server} io
   */
  constructor(io) {
    this.#io = io;
  }

  /**
   * @param {string} socketId
   * @param {string} clientId
   * @param {import('socket.io').Socket} socketClientInstance
   */
  addClient = (socketId, clientId, socketClientInstance) => {
    this.#clients[socketId] = {
      socketId,
      clientId,
      socketClientInstance,
      infos: parseClientInfo(socketClientInstance),
    };
  };

  /**
   * @param {string} socketId
   */
  deleteClient = (socketId) => {
    const disconnect = this.#clients[socketId]?.disconnect;
    if (typeof disconnect === "function") disconnect();
    delete this.#clients[socketId];
  };

  /**
   * @param {import('socket.io').Server} io
   */
  setInstance = (io) => {
    this.#io = io;
  };

  /**
   * @returns {import('socket.io').Server|null}
   */
  getInstance = () => {
    return this.#io;
  };

  /**
   * @param {string} socketId
   * @returns {{socketId: string, clientId: string, socketClientInstance: import('socket.io').Socket}|undefined}
   */
  getClientInstance = (socketId) => {
    return this.#clients[socketId];
  };

  /**
   * @param {string} roomId
   * @returns {import('socket.io').BroadcastOperator|undefined}
   */
  getRoom = (roomId) => {
    return this.#io?.to(roomId);
  };

  /**
   * @param {string} clientId
   * @returns {Array<{socketClientInstance: import('socket.io').Socket}>}
   */
  getClientConnections(clientId) {
    return Object.values(this.#clients)
      .filter((c) => c?.clientId === clientId)
      .map(({ socketClientInstance }) => socketClientInstance);
  }

  /**
   * @param {string} roomId
   * @param {string} clientId
   * @returns {Promise<Array<Object<string, ClientInfo>>>}
   */
  async getClientRoomConnections(roomId, clientId) {
    const sockets = await this.getInstancesByRoomId(roomId);
    return sockets
      .map(({ id }) => this.#clients[id])
      .filter((c) => c.clientId === clientId);
  }

  /**
   * @param {string} socketId
   * @returns {string|undefined}
   */
  getClientIdBySocketId(socketId) {
    return this.#clients[socketId]?.clientId;
  }

  /**
   * @param {string} roomId
   * @returns {Promise<import('socket.io').Socket[]>}
   */
  getInstancesByRoomId = async (roomId) => {
    return (await this.#io?.in(roomId)?.fetchSockets()) || [];
  };
}

module.exports = new SocketStore();

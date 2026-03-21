const parseClientInfo = require("./tools/parseClientInfo");
const redisClient = require("./redisClient");
const { deleteKeys } = require("./redisClient");

const SOCKET_PREFIX = "SOCKET_DATA:"; // clé Redis : socket:<socketId>

deleteKeys(SOCKET_PREFIX).catch((err) => console.error("Redis deleteKeys error (non-fatal):", err));

/**
 * @typedef {Object} ClientInfo
 * @property {string} socketId
 * @property {string} clientId
 * @property {import('socket.io').Socket} socketClientInstance
 * @property {Object} infos
 * @property {string[]} rooms
 * @property {string} connectedAt
 */

/**
 * SocketStore global compatible cluster avec Redis
 */
class SocketStore {
  /** @type {import('socket.io').Server|null} */
  #io = null;

  /** @type {Record<string, ClientInfo>} */
  localClients = {}; // infos locales du worker

  /**
   * Définit l'instance Socket.IO du worker
   * @async
   * @param {import('socket.io').Server} io
   */
  async setInstance(io) {
    this.#io = io;
  }

  /**
   * Récupère l'instance Socket.IO
   * @returns {import('socket.io').Server|null}
   */
  getInstance() {
    return this.#io;
  }

  /**
   * Ajouter un client
   * @param {string} socketId
   * @param {string} clientId
   * @param {import('socket.io').Socket} socketClientInstance
   * @param {string[]} rooms
   * @returns {Promise<void>}
   */
  async addClient(socketId, clientId, socketClientInstance, rooms = []) {
    const infos = parseClientInfo(socketClientInstance);
    const clientData = {
      socketId,
      clientId,
      infos,
      rooms,
      connectedAt: new Date().toISOString(),
    };

    // Stockage Redis
    await redisClient.hSet(SOCKET_PREFIX, socketId, JSON.stringify(clientData));

    // Stockage local
    this.localClients[socketId] = {
      socketClientInstance,
      ...clientData,
    };
  }

  /**
   * Supprimer un client
   * @param {string} socketId
   * @returns {Promise<void>}
   */
  async deleteClient(socketId) {
    const clientInfo = this.localClients[socketId];
    if (!clientInfo) return;

    await redisClient.hDel(SOCKET_PREFIX, socketId);

    delete this.localClients[socketId];
  }
  /**
   * Récupère toutes les instances Socket d’un client (cross-worker)
   * @param {string} clientId
   * @returns {Promise<import('socket.io').BroadcastOperator[]>}
   */
  async getClientSockets(clientId) {
    const all = await redisClient.hVals(SOCKET_PREFIX);
    const sockets = all
      .map((v) => JSON.parse(v))
      .filter((v) => v.clientId === clientId)
      .map((v) => this.#io.to(v.socketId)); // BroadcastOperator cross-worker

    return sockets;
  }

  /**
   * Récupère tous les sockets d'une liste de clients (cross-cluster)
   * @param {string[]} clientIds
   * @returns {Promise<import('socket.io').BroadcastOperator[]>}
   */
  async getClientsSockets(clientIds) {
    if (!clientIds || clientIds.length === 0) return [];

    // récupère tous les clients depuis Redis
    const all = await redisClient.hVals(SOCKET_PREFIX);
    if (!all || all.length === 0) return [];

    const sockets = all
      .map((v) => JSON.parse(v))
      .filter((c) => c && clientIds.includes(c.clientId))
      .map((c) => this.#io.to(c.socketId)); // BroadcastOperator cross-worker

    return sockets;
  }
  /**
   * Récupère tous les sockets d'un client dans une room donnée (cross-cluster)
   * @param {string} clientId - ID du client
   * @param {string} roomId - Room à filtrer
   * @returns {Promise<import('socket.io').BroadcastOperator[]>}
   */
  async getClientSocketsInRoom(clientId, roomId) {
    if (!clientId || !roomId) return [];

    const all = await redisClient.hVals(SOCKET_PREFIX);
    if (!all || all.length === 0) return [];

    const sockets = all
      .map((v) => JSON.parse(v))
      .filter(
        (c) =>
          c &&
          c.clientId === clientId &&
          Array.isArray(c.rooms) &&
          c.rooms.includes(roomId)
      )
      .map((c) => this.#io.to(c.socketId));

    return sockets;
  }

  /**
   * Récupère tous les sockets d'une liste de clients dans une room donnée (cross-cluster)
   * @param {string[]} clientIds - Liste de clients
   * @param {string} roomId - Room à filtrer
   * @returns {Promise<import('socket.io').BroadcastOperator[]>}
   */
  async getClientsSocketsInRoom(clientIds, roomId) {
    if (!clientIds || clientIds.length === 0 || !roomId) return [];

    // récupère tous les clients depuis Redis
    const all = await redisClient.hVals(SOCKET_PREFIX);
    if (!all || all.length === 0) return [];

    // filtre : clientId dans la liste ET rooms inclut la roomId
    const sockets = all
      .map((v) => JSON.parse(v))
      .filter(
        (c) =>
          c &&
          clientIds.includes(c.clientId) &&
          Array.isArray(c.rooms) &&
          c.rooms.includes(roomId)
      )
      .map((c) => this.#io.to(c.socketId));

    return sockets;
  }

  /**
   * Récupère toutes les infos d'un client
   * @param {string} clientId
   * @returns {Promise<ClientInfo[]>}
   */
  async getClientInfo(clientId) {
    const all = await redisClient.hVals(SOCKET_PREFIX);
    return all.map((v) => JSON.parse(v)).filter((v) => v.clientId === clientId);
  }

  /**
   * Récupère toutes les infos clients
   * @returns {Promise<ClientInfo[]>}
   */
  async getAllClients() {
    const all = await redisClient.hVals(SOCKET_PREFIX);
    return all.map((v) => JSON.parse(v));
  }

  /**
   * Récupère les socket objects locaux pour un clientId (ce worker uniquement)
   * @param {string} clientId
   * @returns {import('socket.io').Socket[]}
   */
  getLocalSockets(clientId) {
    return Object.values(this.localClients)
      .filter((c) => c.clientId === clientId)
      .map((c) => c.socketClientInstance);
  }

  /**
   * Récupère tous les sockets connectés à une room (cross-worker)
   * @param {string} roomId
   * @returns {Promise<import('socket.io').BroadcastOperator[]>} tableau utilisable pour io.to(socketId).emit(...)
   */
  async getInstancesByRoomId(roomId) {
    const allClients = await this.getAllClients();
    const clientsInRoom = allClients.filter(
      (c) => c.rooms && c.rooms.includes(roomId)
    );

    return clientsInRoom.map((c) => this.#io.to(c.socketId));
  }

  /**
   * Récupère tous les sockets connectés (cross-worker)
   * @returns {Promise<import('socket.io').BroadcastOperator[]>}
   */
  async getAllInstances() {
    const allClients = await this.getAllClients();
    return allClients.map((c) => this.#io.to(c.socketId));
  }
  /**
   * Ajouter un client dans une room
   * @param {string} socketId
   * @param {string} roomId
   * @returns {Promise<void>}
   */
  async joinRoom(socketId, roomId) {
    // récupère le client depuis Redis
    const clientDataRaw = await redisClient.hGet(SOCKET_PREFIX, socketId);
    if (!clientDataRaw) return;

    const clientData = JSON.parse(clientDataRaw);

    // si le client n'a pas encore de rooms, initialise le tableau
    if (!clientData.rooms) clientData.rooms = [];

    // ajoute la room si elle n'existe pas
    if (!clientData.rooms.includes(roomId)) clientData.rooms.push(roomId);

    // met à jour Redis
    await redisClient.hSet(SOCKET_PREFIX, socketId, JSON.stringify(clientData));

    // met à jour le stockage local du worker
    if (this.localClients[socketId])
      this.localClients[socketId].rooms = clientData.rooms;

    // ajoute la socket à la room dans Socket.IO
    this.#io?.sockets.sockets.get(socketId)?.join(roomId);
  }

  /**
   * Retirer un client d'une room
   * @param {string} socketId
   * @param {string} roomId
   * @returns {Promise<void>}
   */
  async leaveRoom(socketId, roomId) {
    // récupère le client depuis Redis
    const clientDataRaw = await redisClient.hGet(SOCKET_PREFIX, socketId);
    if (!clientDataRaw) return;

    const clientData = JSON.parse(clientDataRaw);

    // retire la room si elle existe
    if (clientData.rooms && clientData.rooms.includes(roomId))
      clientData.rooms = clientData.rooms.filter((r) => r !== roomId);

    // met à jour Redis
    await redisClient.hSet(SOCKET_PREFIX, socketId, JSON.stringify(clientData));

    // met à jour le stockage local
    if (this.localClients[socketId])
      this.localClients[socketId].rooms = clientData.rooms;

    // retire la socket de la room dans Socket.IO
    this.#io?.sockets.sockets.get(socketId)?.leave(roomId);
  }
  /**
   * Vérifie si un client est dans une room donnée
   * @param {string} clientId
   * @param {string} roomId
   * @returns {Promise<boolean>}
   */
  async isClientInRoom(clientId, roomId) {
    const all = await redisClient.hVals(SOCKET_PREFIX);
    if (!all || all.length === 0) return false;

    const clients = all
      .map((v) => JSON.parse(v))
      .filter((c) => c.clientId === clientId);

    for (const client of clients) {
      if (client.rooms && client.rooms.includes(roomId)) {
        return true;
      }
    }

    return false;
  }
  /**
   * Retire un client d'une room à partir de son clientId (toutes ses sockets)
   * @param {string} clientId - ID du client
   * @param {string} roomId - Room à quitter
   * @returns {Promise<void>}
   */
  async leaveRoomByClientId(clientId, roomId) {
    if (!clientId || !roomId) return;

    // récupère tous les clients depuis Redis
    const all = await redisClient.hVals(SOCKET_PREFIX);
    if (!all || all.length === 0) return;

    // filtre les sockets du client
    const clientSockets = all
      .map((v) => JSON.parse(v))
      .filter(
        (c) =>
          c &&
          c.clientId === clientId &&
          Array.isArray(c.rooms) &&
          c.rooms.includes(roomId)
      );

    for (const clientData of clientSockets) {
      // retire la room du tableau
      clientData.rooms = clientData.rooms.filter((r) => r !== roomId);

      // met à jour Redis
      await redisClient.hSet(
        SOCKET_PREFIX,
        clientData.socketId,
        JSON.stringify(clientData)
      );

      // met à jour le stockage local si présent
      if (this.localClients[clientData.socketId]) {
        this.localClients[clientData.socketId].rooms = clientData.rooms;
      }

      // fait quitter la socket de la room
      this.#io?.sockets.sockets.get(clientData.socketId)?.leave(roomId);
    }
  }
  /**
   * Fait quitter **tous les clients** d'une room
   * @param {string} roomId - ID de la room à vider
   * @returns {Promise<void>}
   */
  async leaveRoomForAll(roomId) {
    if (!roomId) return;

    // récupère tous les clients depuis Redis
    const all = await redisClient.hVals(SOCKET_PREFIX);
    if (!all || all.length === 0) return;

    for (const v of all) {
      const clientData = JSON.parse(v);

      // si la socket est dans la room
      if (clientData.rooms && clientData.rooms.includes(roomId)) {
        // retire la room du tableau
        clientData.rooms = clientData.rooms.filter((r) => r !== roomId);

        // met à jour Redis
        await redisClient.hSet(
          SOCKET_PREFIX,
          clientData.socketId,
          JSON.stringify(clientData)
        );

        // met à jour le stockage local si présent
        if (this.localClients[clientData.socketId]) {
          this.localClients[clientData.socketId].rooms = clientData.rooms;
        }

        // fait quitter la socket de la room dans Socket.IO
        this.#io?.sockets.sockets.get(clientData.socketId)?.leave(roomId);
      }
    }
  }
  /**
   * Retourne le nombre total de clients connectés (tous workers confondus)
   * @returns {Promise<number>}
   */
  async getConnectedClientsCount() {
    const all = await redisClient.hVals(SOCKET_PREFIX);
    // console.log("redisClient => ", redisClient);
    // on récupère les clientIds uniques pour ne pas compter plusieurs sockets du même client
    const clientIds = new Set(
      all.map((v) => JSON.parse(v)?.clientId).filter(Boolean)
    );

    return clientIds.size;
  }
  /**
   * Compte le nombre de participants uniques dans une room (tous les workers)
   * @param {string} roomId - ID de la room
   * @returns {Promise<number>} - Nombre de participants uniques (clientId distincts)
   */
  async getRoomParticipantsCount(roomId) {
    if (!roomId) return 0;

    // Récupère toutes les entrées Redis
    const all = await redisClient.hVals(SOCKET_PREFIX);
    if (!all || all.length === 0) return 0;

    // Filtre les clients connectés à cette room
    const clientsInRoom = all
      .map((v) => JSON.parse(v))
      .filter(
        (c) => c.rooms && Array.isArray(c.rooms) && c.rooms.includes(roomId)
      );

    // On ne compte qu’un participant par clientId (même si plusieurs sockets)
    const uniqueClientIds = new Set(clientsInRoom.map((c) => c.clientId));

    return uniqueClientIds.size;
  }
}

module.exports = new SocketStore();

const callSessionSchema = require("./callSessionSchema");
const socketStore = require("../../socketStore");
const CallSession = require("../../models/chats/callSession.model");

class JoinRoom {
  /** @type {string|null} */
  #userId = null;
  /** @type {string|null} */
  #roomId = null;
  /** @type {boolean|null} */
  #isOrganizer = false;
  /** @type {import('socket.io').Socket|null} */
  #socket = null;
  /**
   * @constructor
   * @param {import('socket.io').Socket} socket
   * @param {Object.<string, {id: string}>} data
   * @returns {(socket, data) => void}
   */
  constructor(socket, data) {
    return this.#join(socket, data);
  }
  // @ts-check
  /// <reference path="../../models/chats/callSession.type.js" />
  /** @returns {Promise<CallSession>} */
  #getCallSession = async () =>
    await CallSession.findOne({ _id: this.#roomId });

  /**
   * @param {import('socket.io').Socket} socket
   * @param {Object.<string, {id: string}>} data
   */
  #join = async (socket, data) => {
    this.#userId = socket.userId;
    this.#roomId = data.id;
    this.#socket = socket;
    const state = data.state || {};
    const sockets = await socketStore.getInstancesByRoomId(this.#roomId);

    const [client] = await socketStore.getClientRoomConnections(
      this.#roomId,
      this.#userId
    );

    const socketId = client?.socketId;
    const clientId = client?.clientId;
    const infos = client?.infos;

    for (let i = 0; i < sockets.length; i++) {
      if (socket.id === sockets[i].id) {
        socket.emit("error-room", {
          type: "conflit",
          message: "Client has already joined",
        });
        return;
      }
    }

    if (clientId === this.#userId) {
      socket.emit("ask-room", {
        socketId,
        infos,
        message:
          "A device is already connected to this room with the same user",
      });
      return;
    }

    try {
      const call = await this.#getCallSession();
      if (!call) {
        socket.emit("error-room", {
          type: "notFound",
          message: "Call not found or not exist",
        });
        return;
      }
      let isSignaled = null;
      for (const participant of call.participants) {
        if (participant.identity === this.#userId) {
          socket.join(this.#roomId);
          isSignaled = !participant.state.isInRoom;
          this.#isOrganizer = participant.state.isOrganizer;
          const room = socketStore.getRoom(this.#roomId);
          participant.state.isInRoom = true;
          const updateState = (key) => (participant.state[key] = state[key]);
          Object.keys(state).forEach(updateState);
          call.markModified("participants");
          await call.save();

          // define all events
          socket.on("signal-room", this.#signal);
          socket.on("leave-room", this.#leave);
          socket.on("disconnect", this.#leave);

          if (isSignaled) room.emit("join-room", { userId: this.#userId });
          console.log("join room run !");
          return;
        }
      }
    } catch (e) {
      console.error(e);
      socket.emit("error-room", { type: "serverError", message: e?.message });
    }
  };
  /**
   * @param {import('socket.io').Socket} socket
   * @param {Object.<string, {id: string, participants: Array<string>| undefined}>} data
   */
  #signal = async (data) => {
    /** @type {Array<string>} */
    const clients = Array.isArray(data?.participants) ? data.participants : [];
    const isProtectedStateKey = (key) => ["isInRoom"].includes(key);
    //const isProtectedAuthKey = (key) => ["shareScreen"].includes(key);
    if (!this.#isOrganizer) {
      const [client] = clients;
      if (clients.length === 1 ? client !== this.#userId : clients.length)
        this.#socket.emit("error-room", {
          type: "unauthorized",
          message: "No permission for this action",
        });
      return;
    }
    if (!clients.find((id) => id === this.#userId)) clients.push(this.#userId);
    let updated = false;
    try {
      const call = await this.#getCallSession();
      clients.forEach((id) => {
        const user = call.participants?.find(({ identity }) => identity === id);
        if (hasOwnProp(data, "state")) {
          Object.keys(data.state).forEach((key) => {
            const value = data.state[key];
            if (user.state[key] !== value)
              if (hasOwnProp(user.state, key) && !isProtectedStateKey(key)) {
                user.state[key] = value;
                updated = true;
                if (hasOwnProp(user.state, "isOrganizer"))
                  this.#isOrganizer = user.state.isOrganizer;
              }
          });
        }

        if (hasOwnProp(data, "auth")) {
          Object.keys(data.auth).forEach((key) => {
            const value = data.auth[key];
            if (user.auth[key] !== value)
              if (hasOwnProp(user.auth, key)) {
                user.auth[key] = value;
                updated = true;
              }
          });
        }
      });

      if (updated) {
        call.markModified("participants");
        await call.save();
        socketStore.getRoom(this.#roomId).emit("signal-room", {
          participants: clients,
          state: data?.state,
          auth: data?.auth,
        });
        console.log("signal room run");
      }
    } catch (e) {
      this.#socket.emit("error-room", {
        type: "serverError",
        message: e?.message,
      });
    }
  };

  #leave = async () => {
    const call = await this.#getCallSession();
    const participant = call.participants?.find(
      ({ identity }) => identity === this.#userId
    );
    if (participant) {
      participant.state.isInRoom = false;
      call.markModified("participants");
      await call.save();
    }
    this.#socket.leave(this.#roomId);
    socketStore.getRoom(this.#roomId).emit("leave-room", {
      userId: this.#userId,
    });
  };
}
const hasOwnProp = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
module.exports = JoinRoom;

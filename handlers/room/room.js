// @ts-check
/// <reference path="../../types/callSession.type.js" />
const callSessionSchema = require("./callSessionSchema");
const socketStore = require("../../socketStore");
const CallSession = require("../../models/chats/callSession.model");

/**
 * @typedef {import('socket.io').Socket} BaseSocket
 */

/**
 * @typedef {BaseSocket & { userId: string }} AuthenticatedSocket
 */

/**
 * @typedef {"roomNotFound" | "userNotFound" | "serverError" | "conflit" | "unauthorized"} TypeError
 */

class JoinRoom {
  /** @type {string|undefined} */
  #userId;
  /** @type {string|undefined} */
  #roomId;
  /** @type {boolean} */
  #isOrganizer = false;
  /** @type {AuthenticatedSocket|undefined} */
  #socket;
  /** @type {Object.<TypeError, string>} */
  #errors = {
    roomNotFound: "Call not found or not exist",
    userNotFound: "User not found",
    serverError: "An error occurred during this action",
    conflit: "Client has already joined",
    unauthorized: "No permission for this action",
  };
  /**
   * @constructor
   * @param {AuthenticatedSocket} socket
   * @param {{id: string, state?: ParticipantState, auth?: ParticipantAuth}} data
   */
  constructor(socket, data) {
    this.#join(socket, data);
  }
  /**
   * @param {TypeError} [type]
   * @returns {Object.<TypeError, string> & {type: TypeError, message: string}}
   */
  #getError = (type) => {
    let errors = {};
    if (type)
      return {
        type,
        message: this.#errors[type],
      };
    errors = this.#errors;
    return errors;
  };

  /**
   * @async
   * @returns {Promise<CallSessionDocument>}
   * */
  #getCallSession = async () => {
    const [, _id] = this.#roomId?.split("room-") || [];
    return await CallSession.findOne({ _id });
  };

  /**
   * @async
   * @param {AuthenticatedSocket} socket
   * @param {{id: string, state?: ParticipantState}} data
   */
  #join = async (socket, data) => {
    this.#userId = socket.userId;
    this.#roomId = `room-${data.id}`;
    this.#socket = socket;
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
        socket.emit("error-room", this.#getError().conflit);
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
      const updateCall = await this.#updateCallRoom(data);
      console.log("updateCall => ", updateCall);
      if (!updateCall) return;
      const call = updateCall?.call;
      if (!call) return;
      let isSignaled = null;
      for (const participant of call.participants) {
        if (participant.identity === this.#userId) {
          socket.join(this.#roomId);
          isSignaled = !participant.state.isInRoom;
          const room = socketStore.getRoom(this.#roomId);
          participant.state.isInRoom = true;
          call.markModified("participants");
          await call.save();
          // define all events
          socket.on("signal-room", this.#signal);
          socket.on("leave-room", this.#leave);
          socket.on("banish-room", this.#banish);
          socket.on("close-room", this.#close);
          socket.on("disconnect", this.#leave);

          if (isSignaled) room?.emit("join-room", { userId: this.#userId });
          //console.log("join room run !");
          return;
        }
      }
    } catch (e) {
      console.error(e);
      socket.emit("error-room", this.#getError().serverError);
    }
  };
  /**
   * @async
   * @param {{id: string, participants: string[]|undefined, state:ParticipantState, auth: ParticipantAuth}} data
   */
  #signal = async (data) => {
    if (!this.#roomId) return;
    const { call, updated, clients } = (await this.#updateCallRoom(data)) || {};
    if (updated) {
      await call?.save();
      socketStore.getRoom(this.#roomId)?.emit("signal-room", {
        participants: clients,
        state: data?.state,
        auth: data?.auth,
      });
      //console.log("signal room run");
    }
  };

  /**
   * @async
   * @param {{id: string, participants?: string[]} & {state?: ParticipantState, auth?: ParticipantAuth}} data
   * @returns {Promise<{updated: boolean, call: CallSessionDocument, clients: string[]}|undefined>}
   */
  #updateCallRoom = async (data) => {
    if (!this.#userId) return;
    const call = await this.#getCallSession();
    if (!call) {
      this.#socket?.emit("error-room", this.#getError().roomNotFound);
      return;
    }

    ///const members = call?.participants || [];
    /** @type {Array<string>} */
    let clients = data?.participants || [];
    const isProtectedStateKey = (key = "") => ["isInRoom"].includes(key);
    //const isProtectedAuthKey = (key) => ["shareScreen"].includes(key);
    const participants = call?.participants || [];
    const user = participants.find(({ identity }) => identity === this.#userId);
    if (!user) {
      this.#socket?.emit("error-room", this.#getError().userNotFound);
      return;
    }

    if (!this.#isOrganizer && clients?.length) {
      this.#socket?.emit("error-room", this.#getError().unauthorized);
      return;
    }

    if (!clients.length) clients.push(this.#userId);

    let updated = false;

    try {
      clients.forEach((id) => {
        const user = participants?.find(({ identity }) => identity === id);

        if (user) {
          if (data.state) {
            const state = data.state;
            /** @type {keyof ParticipantState} */
            let stateKey;

            for (stateKey in state) {
              const value = state[stateKey];
              if (value !== undefined)
                if (
                  hasProp(user.state, stateKey) &&
                  !isProtectedStateKey(stateKey)
                ) {
                  user.state[stateKey] = value;
                  updated = true;
                  if (typeof user.state.isOrganizer === "boolean")
                    this.#isOrganizer = user.state.isOrganizer;
                }
            }
          }

          if (data?.auth) {
            /** @type {keyof ParticipantAuth} */
            let authKey;
            for (authKey in data.auth) {
              const value = data.auth[authKey];
              if (value !== undefined && hasProp(user.auth, authKey)) {
                user.auth[authKey] = value;
                updated = true;
              }
            }
          }
        }
      });
      //console.log("updated", updated);
      return { updated, call, clients };
    } catch (e) {
      console.error(e);
      this.#socket?.emit("error-room", this.#getError().serverError);
    }
  };
  /**@async */
  #leave = async () => {
    if (!this.#roomId) return;
    const call = await this.#getCallSession();
    const participant = call.participants?.find(
      ({ identity }) => identity === this.#userId
    );
    const closable = !call.participants?.find(
      ({ identity: id, state }) => id !== this.#userId && state.isInRoom
    );

    if (participant && participant.state.isInRoom) {
      participant.state.isInRoom = false;
      //participant.state.isOrganizer = false;
      participant.state.handRaised = false;
      participant.state.isCamActive = false;
      participant.state.isMicActive = false;

      call.markModified("participants");

      if (closable) {
        call.status = 2;
        call.markModified("status");
      }
      await call.save();
    }
    this.#socket?.emit("leave-room", { userId: this.#userId });
    this.#socket?.leave(this.#roomId);
    if (!closable)
      socketStore.getRoom(this.#roomId)?.emit("leave-room", {
        userId: this.#userId,
      });
    //console.log("leave room run");
  };
  /**
   * @async
   * @param {{userId: string}} data
   */
  #banish = async (data) => {
    if (!this.#roomId) return;
    const roomId = this.#roomId;
    const author = this.#userId;
    const { userId } = data;
    if (!this.#isOrganizer) {
      this.#socket?.emit("error-room", this.#getError().unauthorized);
      return;
    }
    const call = await this.#getCallSession();
    const participants = call.participants;
    const participant = participants?.find(({ identity: id }) => id === author);

    if (participant && participant.state.isInRoom) {
      const sockets = await socketStore.getClientRoomConnections(
        roomId,
        userId
      );
      participant.state.isInRoom = false;
      call.markModified("participants");
      await call.save();
      sockets.forEach(({ socketClientInstance }) => {
        socketClientInstance.emit("banish-room", { author });
        socketClientInstance.leave(roomId);
      });
      socketStore.getRoom(roomId)?.emit("leave-room", { userId });
    }
    //console.log("banish room run");
  };

  /**@async */
  #close = async () => {
    if (!this.#roomId) return;
    const roomId = this.#roomId;
    if (!this.#isOrganizer) {
      this.#socket?.emit("error-room", this.#getError().unauthorized);
      return;
    }
    const room = socketStore.getRoom(roomId);
    room?.emit("close-room", { author: this.#userId });
    const sockets = await socketStore.getInstancesByRoomId(roomId);
    sockets.forEach((socket) => socket.leave(roomId));
    this.#socket?.leave(roomId);
    CallSession.updateMany(
      { _id: roomId },
      {
        $set: {
          status: 2,
          "participants.$[].state.isInRoom": false,
        },
      }
    );
    //console.log("close room run");
  };
}
/**
 * @param {Object<string, unknown>|undefined} obj
 * @param {string} key
 * @returns {boolean}
 */
const hasProp = (obj, key) => typeof obj === "object" && key in obj; // Object.prototype.hasOwnProperty.call(obj, key);
module.exports = JoinRoom;

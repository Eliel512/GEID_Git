// @ts-check
/// <reference path="../../types/callSession.type.js" />
// const callSessionSchema = require("./callSessionSchema");
const socketStore = require("../../socketStore");
const CallSession = require("../../models/chats/callSession.model");
const Chat = require("../../models/chats/chat.model");
const User = require("../../models/users/user.model");
const auth = require("../../middleware/users/auth");
const { isBoolean } = require("lodash");

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
  /** @type {AuthenticatedSocket|undefined} */
  #socket;
  /** @type {Object.<TypeError, string>} */
  #errors = {
    roomNotFound: "Call not found or not exist",
    userNotFound: "User not found",
    serverError: "An error occurred during this action",
    conflit: "Client has already joined",
    unauthorized: "No permission for this action",
    unknownQuery: "Unknown query type",
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
   */
  #update = async () => {
    const call = await this.#getCallSession();
    const roomId = this.#roomId;
    if (!call || !roomId) return;
    const participants = call.toJSON().participants;
    const chat = await Chat.findOne(
      { _id: call.location },
      { messages: 0, __v: 0 }
    )
      .populate({
        path: "members._id",
        model: User,
        select: "_id fname lname mname email grade imageUrl",
      })
      .exec();
    const members = chat
      .toJSON()
      .members.map(
        /** @type {(m: Object & { _id: { _id: string } }) => Object} */ ({
          _id,
        }) => _id
      );
    const data = [];
    const activeUsers = await socketStore.getInstancesByRoomId(roomId);

    for (let p of participants) {
      const id = p.identity.toString();
      /** @type {(m: Object & { _id: string } ) => boolean} */
      const getUser = (m) => m?._id.toString() === id;
      const identity = members?.find(getUser);
      const isInRoom = activeUsers.some(
        (s) => socketStore.getClientInstance(s.id)?.clientId === id
      );
      if (identity) data.push({ ...p, identity, isInRoom });
    }
    this.#socket?.emit("update-room", data);
  };

  /**
   * @async
   * @returns {Promise<CallSessionDocument>}
   * */
  #getCallSession = async () =>
    await CallSession.findOne({ _id: this.#roomId });
  /**
   * @async
   * @returns {Promise<boolean>}
   * */
  #getIsOrganizer = async () => {
    const call = await this.#getCallSession();
    return !!call.participants.find(
      ({ identity, state }) => identity === this.#userId && state.isOrganizer
    );
  };

  /**
   * @async
   * @param {AuthenticatedSocket} socket
   * @param {{id: string, state?: ParticipantState, auth?: ParticipantAuth}} data
   */
  #join = async (socket, data) => {
    this.#userId = socket.userId;
    this.#roomId = data.id;
    this.#socket = socket;

    if (!this.#roomId) {
      socket.emit("error-room", this.#getError().roomNotFound);
      return;
    }

    if (!this.#userId) {
      socket.emit("error-room", this.#getError().userNotFound);
      return;
    }

    if (socket.rooms.has(this.#roomId)) {
      socket.emit("error-room", this.#getError().conflit);
      return;
    }

    const clientSockets = await socketStore.getClientRoomConnections(
      this.#roomId,
      this.#userId
    );
    const client = clientSockets.find((c) => c?.clientId === this.#userId);
    if (client) {
      socket.emit("ask-room", {
        socketId: client?.socketId,
        infos: client?.infos,
        message:
          "A device is already connected to this room with the same user",
      });
      return;
    }
    socket.join(this.#roomId);
    const roomId = this.#roomId;
    this.#applyEventsInClient();
    const isCamActive = data?.state?.isCamActive || false;
    const isMicActive = data?.state?.isMicActive || false;
    try {
      const call = await CallSession.findOneAndUpdate(
        { _id: roomId, "participants.identity": this.#userId },
        {
          $set: {
            "participants.$.state.isInRoom": true,
            "participants.$.state.isCamActive": isCamActive,
            "participants.$.state.isMicActive": isMicActive,
            "participants.$.state.raisedHand": false,
            status: 1,
          },
        },
        { new: true }
      );
      if (!call) {
        socket.emit("error-room", this.#getError().roomNotFound);
        this.#removeEventsInClient();
        socket.leave(this.#roomId);
        return;
      }
      socketStore.getRoom(this.#roomId)?.emit("join-room", {
        userId: this.#userId,
        state: {
          isInRoom: true,
          isCamActive: isCamActive,
          isMicActive: isMicActive,
          raisedHand: false,
        },
      });
      await this.#update();
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
    if (!this.#userId) return;
    const { call, updated, clients } = (await this.#updateCallRoom(data)) || {};
    const isAuth =
      !clients?.includes(this.#userId) && (await this.#getIsOrganizer());

    if (updated) await call?.save();
    socketStore.getRoom(this.#roomId)?.emit("signal-room", {
      participants: clients,
      state: data?.state,
      auth: data?.auth,
      author: isAuth ? this.#userId : undefined,
    });
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
    let clients = (data?.participants || []).filter(
      (id) => id !== this.#userId
    );
    const isProtectedStateKey = (key = "") => ["isInRoom"].includes(key);
    //const isProtectedAuthKey = (key) => ["shareScreen"].includes(key);
    const participants = call?.participants || [];
    const user = participants.find(({ identity }) => identity === this.#userId);

    if (!user) {
      this.#socket?.emit("error-room", this.#getError().userNotFound);
      return;
    }

    if (!(await this.#getIsOrganizer()) && clients?.length) {
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
      return { updated, call, clients };
    } catch (e) {
      console.error(e);
      this.#socket?.emit("error-room", this.#getError().serverError);
    }
  };
  /**
   * @async
   * @param {{controlAuthorization: boolean} & ParticipantAuth} data
   */
  #updateOrganizerAuth = async (data) => {
    const dataCall = await this.#getCallSession();
    const isOrganizer = dataCall?.participants?.some(
      ({ identity, state }) => identity === this.#userId && state.isOrganizer
    );

    if (!isOrganizer || !this.#roomId) {
      this.#socket?.emit("error-room", this.#getError().unauthorized);
      return;
    }
    if (Object.keys(data).length === 0) return;

    let { controlAuthorization, writeMessage, ...rest } = data;
    /** @typedef {"shareScreen" | "activateCam" | "activateMic"  | "react" | "allowPrivateMessage"} AuthKey  */
    const organizerAuth = dataCall?.organizerAuth;

    const updatedAuth =
      controlAuthorization !== organizerAuth.controlAuthorization ||
      writeMessage !== organizerAuth.writeMessage;

    controlAuthorization = isBoolean(controlAuthorization)
      ? controlAuthorization
      : organizerAuth?.controlAuthorization;
    writeMessage = isBoolean(writeMessage)
      ? writeMessage
      : organizerAuth?.writeMessage;
    /**@type {AuthKey[]} */
    const controlProps = ["shareScreen", "activateCam", "activateMic", "react"];
    /**@type {AuthKey[]} */
    const messagingProps = ["allowPrivateMessage"];

    /** @type {Object.<string, boolean|undefined>}*/
    const auth = { controlAuthorization, writeMessage };
    /** @type {Object.<string, boolean|undefined>}*/
    const queryAuth = {
      "participants.$[noOrg].auth.controlAuthorization": controlAuthorization,
      "participants.$[noOrg].auth.writeMessage": writeMessage,
    };

    /** @type {Object.<string, boolean|undefined>}*/
    const state = {};
    /** @type {Object.<string, boolean|undefined>}*/
    const queryState = {};

    /** @type {Object.<string, string|undefined>}*/
    const stateKey = {
      shareScreen: "screenShared",
      activateCam: "isCamActive",
      activateMic: "isMicActive",
    };
    /** @type AuthKey - controlProp*/
    let cp;

    if (controlAuthorization)
      for (cp of controlProps) {
        const v = rest[cp]; // value
        const sk = stateKey[cp]; // state key
        if (isBoolean(v) && sk && !v) {
          queryState[`participants.$[noOrg].state.${sk}`] = v;
          state[sk] = v;
        }
        queryAuth[`participants.$[noOrg].auth.${cp}`] = v;
        auth[cp] = v;
      }
    /** @type  AuthKey - messagingProp */
    let mp;
    if (writeMessage)
      for (mp of messagingProps) {
        const v = rest[mp]; // value
        queryAuth[`participants.$[noOrg].auth.${mp}`] = v;
      }
    if (!(updatedAuth || Object.keys(state).length >= 3)) return;
    /** @type {CallSessionDocument} */
    const call = await CallSession.findOneAndUpdate(
      { _id: this.#roomId },
      {
        $set: {
          organizerAuth: {
            controlAuthorization,
            writeMessage,
            ...rest,
          },
          ...queryAuth,
          ...queryState,
        },
      },
      { new: true, arrayFilters: [{ "noOrg.state.isOrganizer": false }] }
    );

    if (!call) return;
    const organizers = [];
    const participants = [];

    for (const p of call.participants)
      if (p.state.isOrganizer) organizers.push(p.identity);
      else participants.push(p.identity);

    socketStore.getRoom(this.#roomId)?.emit("signal-room", {
      participants,
      state,
      auth,
      author: this.#userId,
    });
    for (const id of organizers) {
      (await socketStore.getClientRoomConnections(this.#roomId, id)).forEach(
        ({ socketClientInstance }) =>
          socketClientInstance?.emit("update-auth-room", data)
      );
    }
  };

  /**@async */
  #leave = async () => {
    if (!this.#roomId) return;
    console.log("leave => ", this.#userId);
    const call = await this.#getCallSession();
    const closable =
      (await socketStore.getInstancesByRoomId(this.#roomId))?.length === 0;
    const usersInRoom = call.participants.filter(({ state }) => state.isInRoom);
    const [lastUser] = usersInRoom;
    const isOne = usersInRoom.length === 1;
    const isLastUser = isOne && lastUser.identity === this.#userId;

    call.participants = call.participants.map((p) => {
      if (p.identity === this.#userId || closable) {
        p.state.isInRoom = false;
        p.state.handRaised = false;
        p.state.isCamActive = false;
        p.state.isMicActive = false;
      }
      return p;
    });

    call.markModified("participants");
    if (closable || isLastUser) {
      call.status = 2;
      call.markModified("status");
    }
    await call.save();
    this.#socket?.emit("leave-room", { userId: this.#userId });
    this.#socket?.leave(this.#roomId);
    this.#removeEventsInClient();
    if (!closable)
      socketStore.getRoom(this.#roomId)?.emit("leave-room", {
        userId: this.#userId,
      });
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
    if (!(await this.#getIsOrganizer())) {
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
  };

  /**@async */
  #close = async () => {
    if (!this.#roomId) return;
    const roomId = this.#roomId;
    if (!(await this.#getIsOrganizer())) {
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
  };

  /**async
   * @async
   * @param {{type:  "shareScreen" | "activateMic" | "activateCam" | "pin" | "writeMessage"}} data
   */
  #queryToAuth = async (data) => {
    if (await this.#getIsOrganizer()) return;
    switch (data.type) {
      case "shareScreen": {
      }
      default: {
        this.#socket?.emit("error-room", this.#getError().unknownQuery);
      }
    }
  };

  /** @type {Object.<any, Function>} */
  #events = {
    join: this.#join,
    signal: this.#signal,
    leave: this.#leave,
    banish: this.#banish,
    close: this.#close,
    updateAuth: this.#updateOrganizerAuth,
    queryToAuth: this.#queryToAuth,
  };
  #applyEventsInClient = () => {
    for (let e in this.#events) {
      this.#socket?.on(`${this.#camelToKebab(e)}-room`, this.#events[e]);
    }
    this.#socket?.on("disconnect", this.#leave);
  };
  #removeEventsInClient = () => {
    for (let e in this.#events) {
      this.#socket?.off(`${this.#camelToKebab(e)}-room`, this.#events[e]);
    }
    this.#socket?.off("disconnect", this.#leave);
  };
  /**
   *
   * @param {string} str
   * @returns str
   */
  #camelToKebab = (str) => {
    return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  };
}
/**
 * @param {Object<string, unknown>|undefined} obj
 * @param {string} key
 * @returns {boolean}
 */
const hasProp = (obj, key) => typeof obj === "object" && key in obj; // Object.prototype.hasOwnProperty.call(obj, key);

module.exports = JoinRoom;

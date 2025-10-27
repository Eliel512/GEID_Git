// @ts-check
/// <reference path="../../types/callSession.type.js" />
// const callSessionSchema = require("./callSessionSchema");
const socketStore = require("../../socketStore");
const CallSession = require("../../models/chats/callSession.model");
const Guest = require("../../models/chats/guests.model");
const generateUid = require("../../controllers/chats/call/createRoom/generateUId");
const JoinRoom = require("./room");
/**
 * @typedef {import('socket.io').Socket} BaseSocket
 */
/**
 * @typedef {BaseSocket & { userId: string, isGuest: boolean }} AuthenticatedSocket
 */
/**
 * @typedef {{roomId: string, name: string, userId: string}}GUEST
 */
/**
 * @type {GUEST[]}
 */
const GUEST = [
  // {
  //   roomId: null,
  //   name: "",
  //   id: null,
  // },
];
/**
 * @async
 * @param {AuthenticatedSocket} socket
 * @param {{roomId: string, name: string, id: string}} data
 */
const queryToJoin = async (socket, data) => {
  const userId = socket.userId;
  const isGuest = socket.isGuest;
  const roomId = data.roomId;
  const name = data.name;
  if (!roomId) {
    socket.emit("error", "Room not found");
    return;
  }
  if (getGuest(userId)) return;
  /** @type {CallSessionDocument} */
  const call = await CallSession.findOne({ _id: roomId });
  if (!call) {
    socket.emit("error", "Room not found");
    return;
  }
  const instancesClients = await socketStore.getInstancesByRoomId(roomId);
  const newGuest = { roomId, name, userId };
  const organizers = instancesClients.filter((instance) => {
    const clientId = socketStore.getClientIdBySocketId(instance.id);
    return call.participants.some(
      ({ identity, state }) => identity === clientId && state.isOrganizer
    );
  });

  console.log("organizers => ", instancesClients);

  addGuestIfNotExists(newGuest);
  organizers.forEach((socket) => {
    socket.emit("request-join-room", newGuest);
  });
  const onDisconnect = () => {
    removeGuest(userId);
  };
  // const onAcceptRequest = () => {
  //   removeGuest(userId);
  // };
  // const onDeclineRequest = () => {
  //   removeGuest(userId);
  // };

  // socket.once("accept-join-room", onAcceptRequest);
  // socket.once("decline-join-room", onDeclineRequest);
  socket.once("disconnect", onDisconnect);
  // socket.once("abort-join-room", onDisconnect);

  // instancesClients.
};
/**
 * @async
 * @param {AuthenticatedSocket} socket
 * @param {{roomId: string, id: string}} data
 */
const acceptJoinRoom = async (socket, data) => {
  const userId = socket.userId;
  const guest = getGuest(data.id);
  if (!guest || data.roomId) return;

  let newGuest = new Guest({
    name: guest.name,
    _id: guest.userId,
  });
  await newGuest.save();

  /** @type {CallSessionDocument} */
  const call = await CallSession.findOne({ _id: guest.roomId });
  if (!call) return;
  /** @type {number[]} */
  const excludes = call?.participants
    .map(({ uid, screenId }) => [uid, screenId])
    .flat();

  const { randomNumbers, screenNumbers } = generateUid(1, excludes);
  const [uid] = randomNumbers;
  const [screenId] = screenNumbers;
  /** @type {Record<keyof ParticipantState, boolean> |  Object<string, boolean>} */
  let state = {};
  /**  @type {Record<keyof OrganizerAuth, boolean> | Object<string, boolean>} */
  let auth = {};

  if (call.organizerAuth.controlAuthorization) {
    state.screenShared = !!call.organizerAuth.shareScreen;
    state.isCamActive = !!call.organizerAuth.activateCam;
    state.isMicActive = !!call.organizerAuth.activateMic;
    auth = {};
    /** @type {keyof OrganizerAuth} */
    let key;
    for (key in call.organizerAuth)
      if (key !== "controlAuthorization") auth[key] = !!call.organizerAuth[key];
  }

  await CallSession.updateOne(
    { _id: guest.roomId },
    {
      $push: {
        participants: {
          identity: guest.userId,
          itemModel: "guests",
          uid,
          screenId,
          state,
          auth,
        },
      },
    }
  );
  socketStore.getClientConnections(guest.roomId).forEach((socket) => {
    socket.emit("accept-join-room", {
      author: userId,
      guest: guest.userId,
      roomId: guest.roomId,
    });
  });
  removeGuest(guest.userId);
  const update = await JoinRoom.getUpdateData(guest.roomId);
  socketStore.getRoom(guest.roomId)?.emit("update-room", update);
};

/**
 * @async
 * @param {GUEST} guest
 */
const addGuest = async (guest) => {
  GUEST.push(guest);
};

/**
 *
 * @param {string} id
 * @returns GUEST
 */
const getGuest = (id) => {
  return GUEST.find((guest) => guest.userId === id);
};
/**
 *
 * @param {string} roomId
 * @returns {{name: string, userId: string, image?: string, type: string}[]}
 */
const getGuestsFromRoomId = (roomId) => {
  return GUEST.filter((guest) => guest.roomId === roomId).map((guest) => {
    return {
      name: guest.name,
      userId: guest.userId,
      image: undefined,
      type: "guest",
    };
  });
};

/**
 *
 * @param {GUEST} guest
 */
const addGuestIfNotExists = async (guest) => {
  if (!getGuest(guest.userId)) await addGuest(guest);
};
/**
 *
 * @returns GUEST[]
 */
const getGuests = () => {
  return GUEST;
};

/**
 * @param {string} id
 */
const removeGuest = (id) => {
  GUEST.splice(
    GUEST.findIndex((guest) => guest.userId === id),
    1
  );
};

module.exports = queryToJoin;
module.exports.addGuest = addGuest;
module.exports.getGuest = getGuest;
module.exports.getGuests = getGuests;
module.exports.removeGuest = removeGuest;
module.exports.addGuestIfNotExists = addGuestIfNotExists;
module.exports.acceptJoinRoom = acceptJoinRoom;

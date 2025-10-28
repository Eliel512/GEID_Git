// @ts-check
/// <reference path="../../types/callSession.type.js" />
// const callSessionSchema = require("./callSessionSchema");
const socketStore = require("../../socketStore");
const CallSession = require("../../models/chats/callSession.model");
const Guest = require("../../models/chats/guests.model");
const generateUid = require("../../controllers/chats/call/createRoom/generateUId");
const redisClient = require("../../redisClient");
const { deleteKeys } = require("../../redisClient");
const JoinRoom = require("./room");

const GUEST_PREFIX = "GUEST_DATA:";

/**
 * @typedef {import('socket.io').Socket} BaseSocket
 */
/**
 * @typedef {BaseSocket & { userId: string, isGuest: boolean }} AuthenticatedSocket
 */
/**
 * @typedef {{roomId: string, name: string, userId: string}} GUEST
 */

deleteKeys(GUEST_PREFIX);

/**
 * @async
 * @param {AuthenticatedSocket} socket
 * @param {{roomId: string, name: string, id: string}} data
 */
const requestJoinRoom = async (socket, data) => {
  const userId = socket.userId;
  //const isGuest = socket.isGuest;
  const roomId = data.roomId;
  const name = data.name;
  if (!roomId) {
    socket.emit("error", "'roomId' is required");
    return;
  }
  if (await getGuest(userId)) return;
  /** @type {CallSessionDocument} */
  const call = await CallSession.findOne({ _id: roomId });
  if (!call) {
    socket.emit("error", "Room not found");
    return;
  }
  const newGuest = { roomId, name, userId };
  const organizers = call.participants
    .filter(({ state }) => state.isOrganizer)
    .map(({ identity }) => identity);
  await addGuest(newGuest);
  const organizerSocketBroadcasts = await socketStore.getClientsSocketsInRoom(
    organizers,
    roomId
  );

  organizerSocketBroadcasts.forEach((socketBroadcast) => {
    socketBroadcast.emit("request-join-room", newGuest);
  });
  /**
   * @param {{roomId: string}} param0
   * @returns {Promise<void>}
   */
  const abortJoinRoom = async ({ roomId: id }) => {
    console.log("abortJoinRoom => ", id);
    if (id !== roomId) return;
    await removeGuest(userId);
    organizerSocketBroadcasts.forEach((socketBroadcast) => {
      socketBroadcast.emit("abort-join-room", newGuest);
    });
    socket.off("disconnect", disconnect);
    socket.off("decline-join-room", abortJoinRoom);
  };

  const disconnect = () => abortJoinRoom({ roomId });

  socket.once("disconnect", disconnect);
  socket.once("decline-join-room", abortJoinRoom);
};

/**
 * @async
 * @param {AuthenticatedSocket} socket
 *  @param {{roomId: string, status: 'accepted' | 'declined', userId: string}} data
 */
const responseJoinRoom = async (socket, data) => {
  console.log("responseJoinRoom => ", data);
  const userId = socket.userId;
  const roomId = data.roomId;
  const guest = await getGuest(data.userId);
  if (!guest || !roomId) return;

  /** @type {CallSessionDocument} */
  const call = await CallSession.findOne({ _id: roomId });
  if (!call) return;
  const pts = call.participants;

  const isOrganizer = pts.some(
    ({ identity, state }) => identity === userId && state.isOrganizer
  );
  if (!isOrganizer) return;

  const socketBroadcasts = await socketStore.getClientSockets(data.userId);

  if (data.status !== "accepted") {
    await removeGuest(data.userId);
    socketBroadcasts.forEach((socket) => {
      socket.emit("response-join-room", data);
    });
    return;
  }

  if (pts.find(({ identity }) => identity === guest.userId)) {
    socketBroadcasts.forEach((socket) => {
      socket.emit("response-join-room", data);
    });
    return;
  }

  await Guest.findOneAndUpdate(
    { _id: guest.userId },
    { $setOnInsert: { name: guest.name } },
    { upsert: true, new: true }
  );

  /** @type {number[]} */
  const excludes = pts.map(({ uid, screenId }) => [uid, screenId]).flat();
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
    /** @type {keyof OrganizerAuth} */
    let key;
    for (key in call.organizerAuth)
      if (key !== "controlAuthorization") auth[key] = !!call.organizerAuth[key];
  }

  const updateCall = await CallSession.findOneAndUpdate(
    { _id: roomId },
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
    },
    {
      new: true,
    }
  );
  if (!updateCall) return;
  const update = await JoinRoom.getUpdateData(roomId);
  socketStore.getInstance()?.to(roomId).emit("update-room", update);
  socketBroadcasts.forEach((socket) => {
    socket.emit("response-join-room", data);
  });
};

/**
 * @async
 * @param {GUEST} guest
 */
const addGuest = async (guest) => {
  await redisClient.hSet(GUEST_PREFIX, guest.userId, JSON.stringify(guest));
};

/**
 *@async
 * @param {string} id
 * @returns {Promise<GUEST|null>}
 */
const getGuest = async (id) => {
  const gustDataRow = await redisClient.hGet(GUEST_PREFIX, id);
  if (!gustDataRow) return null;
  return JSON.parse(gustDataRow);
};

/**
 * @param {string} roomId
 * *  @returns {Promise<GUEST[]>}
 */
const getGuestsFromRoomId = async (roomId) => {
  const all = await getGuests();
  return all.filter((g) => g.roomId === roomId);
};

/**
 * @async
 *  @returns {Promise<GUEST[]>}
 */
const getGuests = async () => {
  const all = await redisClient.hVals(GUEST_PREFIX);
  return all.map((v) => JSON.parse(v));
};

/**
 * @async
 * @param {string} id
 * @returns {Promise<void>}
 */
const removeGuest = async (id) => {
  if (!id) return;
  await redisClient.hDel(GUEST_PREFIX, id);
};

module.exports = {
  addGuest,
  getGuest,
  getGuests,
  removeGuest,
  getGuestsFromRoomId,
  responseJoinRoom,
  requestJoinRoom,
};

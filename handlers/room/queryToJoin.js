// @ts-check
/// <reference path="../../types/callSession.type.js" />
/// <reference path="../../types/user.type.js" />
// const callSessionSchema = require("./callSessionSchema");
const socketStore = require("../../socketStore");
const CallSession = require("../../models/chats/callSession.model");
const Guest = require("../../models/chats/guests.model");
const generateUid = require("../../controllers/chats/call/createRoom/generateUId");
const redisClient = require("../../redisClient");
const { deleteKeys } = require("../../redisClient");
const JoinRoom = require("./room");
const User = require("../../models/users/user.model");

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

/**
 * @typedef {{roomId: string} & User} UserAsGuest
 */

/**
 * @typedef {"roomNotFound" | "userNotFound" | "serverError" | "conflit" | "unauthorized" | "unknownQuery" | "invalidRoomId" | "invalidUserId" | "invalidName" | "invalidStatus" } TypeError
 */

/**
 * @typedef {Object} Error
 * @property {TypeError} type
 * @property {string} message
 */

/**
 * @typedef {Object} ErrorTypeOject
 */

deleteKeys(GUEST_PREFIX);

/** @type {Record<TypeError, string>} */
const errors = {
  roomNotFound: "Call not found or not exist",
  invalidRoomId: "roomId is required",
  invalidUserId: "userId is required",
  invalidName: "name is required",
  invalidStatus: "unknown status",
  userNotFound: "User not found",
  serverError: "An error occurred during this action",
  conflit: "Client has already joined",
  unauthorized: "No permission for this action",
  unknownQuery: "Unknown query type",
};

/**
 * @returns {Record<TypeError, {type: TypeError, message: string}>}
 */
const createError = () => {
  /** @type {TypeError} */
  let type;
  /** @type {Record<TypeError, {type: TypeError, message: string}> | *} */
  const obj = {};
  for (type in errors) if (type) obj[type] = { type, message: errors[type] };
  return obj;
};

/**
 * @async
 * @param {AuthenticatedSocket} socket
 * @param {{roomId: string, name: string, id: string}} data
 */
const requestJoinRoom = async (socket, data) => {
  console.log(data);
  const userId = socket.userId;
  const isGuest = socket.isGuest;
  const roomId = data.roomId;
  const name = data.name;
  if (!roomId) {
    socket.emit("error", createError().invalidRoomId);
    return;
  }
  if (await getGuest(userId)) {
    console.log("already guest");
    return;
  }
  /** @type {CallSessionDocument} */
  const call = await CallSession.findOne({ _id: roomId });
  if (!call) {
    socket.emit("error", createError().roomNotFound);
    return;
  }

  /** @type {UserAsGuest|GUEST|null} */
  let newGuest = null;

  if (!isGuest) {
    /** @type {UserDocument} */
    const user = await User.findOne({ _id: userId }).select(
      "_id name fname mname lname email grade imageUrl"
    );
    newGuest = { ...user.toJSON(), roomId };
  }
  newGuest ??= { roomId, name, userId };
  await addGuest(newGuest);

  const organizers = call.participants
    .filter(({ state }) => state.isOrganizer)
    .map(({ identity }) => identity);

  (await socketStore.getClientsSocketsInRoom(organizers, roomId)).forEach(
    (socketBroadcast) => {
      socketBroadcast.emit("request-join-room", newGuest);
    }
  );
  /**
   *
   * @param {{roomId: string}} param0
   * @returns
   */
  const disconnect = async ({ roomId: id }) => {
    if (id !== roomId) return;
    await abortJoinRoom({ roomId, userId });
    socket.off("disconnect", disconnect);
    socket.off("decline-join-room", abortJoinRoom);
  };

  socket.once("disconnect", () => disconnect({ roomId }));
  socket.once("decline-join-room", disconnect);
};

/**
 * @param {{roomId: string, userId: string}} param
 * @returns {Promise<boolean>}
 */
const abortJoinRoom = async ({ roomId, userId }) => {
  if (!roomId || !userId) return false;
  const newGuest = await getGuest(userId);
  await removeGuest(userId);
  if (!newGuest) return false;
  /** @type {CallSessionDocument} */
  const call = await CallSession.findOne({ _id: roomId });
  if (!call) return false;
  const organizers = call.participants
    .filter(({ state }) => state.isOrganizer)
    .map(({ identity }) => identity);
  (await socketStore.getClientsSocketsInRoom(organizers, roomId)).forEach(
    (socketBroadcast) => {
      socketBroadcast.emit("abort-join-room", newGuest);
    }
  );
  return true;
};

/**
 * @async
 * @param {AuthenticatedSocket} socket
 *  @param {{roomId: string, status: 'accepted' | 'declined', userId: string}} data
 */
const responseJoinRoom = async (socket, data) => {
  if (!["accepted", "declined"].includes(data.status)) {
    socket.emit("error", createError().invalidStatus);
    return;
  }

  const userId = socket.userId;
  const roomId = data.roomId;
  const guest = await getGuest(data.userId);

  if (!roomId) {
    socket.emit("error", createError().invalidRoomId);
    return;
  }
  if (!guest) {
    socket.emit("error", createError().userNotFound);
    return;
  }

  /** @type {CallSessionDocument} */
  const call = await CallSession.findOne({ _id: roomId });
  if (!call) return;
  const pts = call.participants;

  const isOrganizer = pts.some(
    ({ identity, state }) => identity === userId && state.isOrganizer
  );
  if (!isOrganizer) return;

  if (data.status === "declined") {
    await abortJoinRoom({ roomId, userId: data.userId });
    (await socketStore.getClientSockets(data.userId)).forEach((socket) => {
      socket.emit("response-join-room", data);
    });
    return;
  }
  const clientId = "userId" in guest ? guest.userId : guest._id;

  if (pts.find(({ identity }) => identity === clientId)) {
    await abortJoinRoom({ roomId, userId: data.userId });
    (await socketStore.getClientSockets(data.userId)).forEach((socket) => {
      socket.emit("response-join-room", data);
    });
    return;
  }

  if ("name" in guest) {
    await Guest.findOneAndUpdate(
      { _id: clientId },
      { $setOnInsert: { name: guest.name } },
      { upsert: true, new: true }
    );
  }

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
          identity: clientId,
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
  await abortJoinRoom({ roomId, userId: data.userId });
  socketStore.getInstance()?.to(roomId).emit("update-room", update);
  (await socketStore.getClientSockets(data.userId)).forEach((socket) => {
    socket.emit("response-join-room", data);
  });
};

/**
 * @async
 * @param {GUEST|UserAsGuest} guest
 */
const addGuest = async (guest) => {
  const id = ("userId" in guest ? guest.userId : guest._id).toString();
  return await redisClient.hSet(GUEST_PREFIX, id, JSON.stringify(guest));
};

/**
 *@async
 * @param {string} id
 * @returns {Promise<GUEST|UserAsGuest|null>}
 */
const getGuest = async (id) => {
  const gustDataRow = await redisClient.hGet(GUEST_PREFIX, id);
  if (!gustDataRow) return null;
  return JSON.parse(gustDataRow);
};

/**
 * @param {string} roomId
 * *  @returns {Promise<(GUEST|UserAsGuest)[]>}
 */
const getGuestsFromRoomId = async (roomId) => {
  const all = await getGuests();
  return all.filter((g) => g.roomId === roomId);
};

/**
 * @async
 *  @returns {Promise<(GUEST|UserAsGuest)[]>}
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
  abortJoinRoom,
};

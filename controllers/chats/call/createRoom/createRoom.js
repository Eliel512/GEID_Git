// @ts-check
/// <reference path="../../../../types/callSession.type.js" />
/// <reference path="../../../../types/user.type.js" />
/// <reference path="../../../../types/chat.type.js" />

const User = require("../../../../models/users/user.model");
const Chat = require("../../../../models/chats/chat.model");
const CallSession = require("../../../../models/chats/callSession.model");
const generateId = require("../../../../tools/generateId");
const getCallDetails = require("./getCallSessionDetails");
const callSessionSchema = require("./callSessionSchema");
const generateUId = require("./generateUId");
const socket = require("../../../../handlers/socket");
const roomStore = require("../../../../serverStore");
const { identity } = require("lodash");

/**
 * @typedef {{open?: boolean, title?: string, state?: ParticipantState, auth?: ParticipantAuth, type: ChatType, target: string, tokenType?: string, role?: string, startedAt?: string|Date|number, endedAt?: string|Date|number, duration?: Duration , summary?: string, description?: string}} DataRequest
 */

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
module.exports = async (req, res) => {
  /** @type {string} */
  const userId = res.locals.userId;

  /** @type {DataRequest} */
  const data = req.body || {};
  /** @type {UserDocument} */
  const user = await User.findOne({ _id: userId }).select(
    "_id fname mname lname grade email imageUrl contacts"
  );
  /** @type {string} */
  let roomId;
  /** @type {ChatDocument|undefined} */
  let room;
  /** @type {Object|undefined} */
  let query;
  /** @type {string} */
  let location = "";

  const duration = data.duration;

  const { type, target } = data;

  if (!user) return res.status(400).json({ message: "User not found" });

  if (type === "direct") {
    if (!user.contacts?.includes(target))
      return res.status(400).json({
        message: "User not in contacts",
      });
    delete user?.contacts;
    query = {
      "members._id": { $all: [target, userId] },
      type,
    };
    location = target;
  } else if (type === "room") {
    room = await Chat.findOne({ _id: target, type }, { messages: 0, __v: 0 })
      .populate({
        path: "members._id",
        model: User,
        select: "_id fname lname mname email grade imageUrl",
      })
      .exec();
    if (!room) return res.status(400).json({ message: "Room not found" });
    query = { _id: data.target, type };
    location = room?.id;
  } else return res.status(400).json({ message: "'type' param incorrect" });

  do {
    roomId = generateId(9);
  } while (await CallSession.exists({ _id: roomId }));

  const nbr = room?.members?.length || 0;
  const agoraIds = generateUId(nbr);

  const participants = [];
  /** @type {Object<string, any>} */
  const members = {};
  for (let i = 0; i < nbr; i++) {
    const { _id: user } = room?.members[i] || {};
    const identity = user?._id?.toString() || "";
    members[identity] = user;
    const isOrganizer = identity === userId;
    const uid = agoraIds.randomNumbers[i];
    const screenId = agoraIds.screenNumbers[i];
    participants.push({
      identity,
      itemModel: "users",
      uid,
      screenId,
      state: { isOrganizer, ...(isOrganizer && { ...data?.state }) },
      auth: { shareScreen: true, ...(isOrganizer && { ...data?.auth }) },
    });
  }

  const callDetails = await getCallDetails(userId, data);
  if (callDetails.error)
    return res.status(400).json({ message: callDetails.message });

  const { error, value } = callSessionSchema.validate({
    _id: roomId,
    title: data.title,
    startedAt: data.startedAt || Date.now().toLocaleString(),
    endedAt: data.endedAt,
    duration: {
      hours: duration?.hours,
      minutes: duration?.minutes,
      seconds: duration?.seconds,
    },
    open: data.open ? true : false,
    summary: data.summary,
    description: data.description,
    createdBy: userId,
    status: 0,
    location,
    participants,
    callDetails,
    ...(data.type === "room" && {
      room: {
        id: room?._id,
        name: room?.name,
        description: room?.description,
      },
    }),
  });

  if (error) return res.status(400).json({ message: error.message });
  /** @type {CallSessionDocument} */
  let call;
  try {
    call = new CallSession(value);

    await call.save();
    const result = JSON.parse(JSON.stringify(call));

    result.participants = result?.participants?.map(
      (/** @type {Object&{identity: string}} */ participant) => {
        return {
          ...participant,
          identity: members[participant.identity],
        };
      }
    );
    return res.status(200).json(result);
  } catch (error) {
    console.error("error => ", error);
    return res
      .status(500)
      .json("An error occurred during this action, please try again later");
  }
};

// @ts-check
/// <reference path="../../../../types/callSession.type.js" />
/// <reference path="../../../../types/user.type.js" />
/// <reference path="../../../../types/chat.type.js" />

const User = require("../../../../models/users/user.model");
const Chat = require("../../../../models/chats/chat.model");
const callSession = require("../../../../models/chats/callSession.model");
const generateId = require("../../../../tools/generateId");
const getCallDetails = require("./getCallSessionDetails");
const callSessionSchema = require("./callSessionSchema");
const socket = require("../../../../handlers/socket");
const roomStore = require("../../../../serverStore");

/**
 * @typedef {{open?: boolean, title?: string, state?: ParticipantState, type: ChatType, target: string, tokenType?: string, role?: string, startedAt?: string|Date|number, endedAt?: string|Date|number, duration?: Duration , summary?: string, description?: string}} DataRequest
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
  } while (await callSession.exists({ _id: roomId }));

  const participants = room?.members.map(({ _id: user }) => ({
    identity: user._id.toString(),
    itemModel: "users",
    state: { ...data.state, isOrganizer: true },
    auth: { shareScreen: true },
  }));

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
    location,
    participants,
    callDetails,
  });
  if (error) return res.status(400).json({ message: error.message });
  let call, callError;
  try {
    call = await callSession.create(value);
    return res.status(200).json(call);
  } catch (error) {
    console.error("error => ", error);
    callError = "An error occurred during this action, please try again later";
  }
  return res.status(callError ? 500 : 200).json(call || { message: callError });
};

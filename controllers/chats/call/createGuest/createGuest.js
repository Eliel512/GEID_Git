// @ts-check
/// <reference path="../../../../types/callSession.type.js" />
/// <reference path="../../../../types/guest.type.js" />
const jwt = require("../../../../tools/jwt");
const CallSession = require("../../../../models/chats/callSession.model");
const Guest = require("../../../../models/chats/guests.model");
const { getGuest } = require("../../../../handlers/room/queryToJoin");

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const createGuest = async (req, res) => {
  /**@type {string} */
  const roomId = req.body?.code || req.body?.roomId;
  /**@type {string} */
  let _id = req.body?.id || null;
  /**@type {string} */
  const name = req.body?.name;

  console.log("Create Guest called with:", { roomId, _id, name });

  /**@type {GuestUserDocument} */
  let guest;
  if (!roomId) return res.status(400).json({ message: "'roomId' is required" });

  /** @type {CallSessionDocument} */
  const call = await CallSession.findOne({ _id: roomId });

  if (!call) return res.status(404).json({ message: "Room not found" });

  const participants = call.participants;
  const id = participants.find(({ identity: id }) => id === _id)?.identity;

  if (_id === id) {
    guest = await Guest.findOne({ _id });
    if (guest)
      return res.status(409).json({
        message: "Guest  already exits",
        name,
        token: jwt.sign({ _id, isGuest: true }),
      });
  }

  if (!name) return res.status(400).json({ message: "'name' is required" });

  try {
    while (_id ? getGuest(_id) : true) {
      guest = await Guest.create({ name });
      _id ??= guest._id;
    }
    // await guest?.save();
    return res.status(200).json({
      message: "Guest created",
      name: req.body?.name,
      token: jwt.sign({ _id, isGuest: true }),
      _id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred" });
  }
};

module.exports = createGuest;

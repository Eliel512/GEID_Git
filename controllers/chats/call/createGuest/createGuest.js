// @ts-check
/// <reference path="../../../../types/callSession.type.js" />
/// <reference path="../../../../types/guest.type.js" />
const jwt = require("../../../../tools/jwt");
const CallSession = require("../../../../models/chats/callSession.model");
const Guest = require("../../../../models/chats/guests.model");
const { getGuest } = require("../../../../handlers/room/queryToJoin");
const { Types } = require("mongoose");

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

  /**@type {GuestUserDocument} */
  let guest;
  if (!roomId) return res.status(400).json({ message: "'roomId' is required" });

  /** @type {CallSessionDocument} */
  const call = await CallSession.findOne({ _id: roomId });

  if (!call) return res.status(404).json({ message: "Room not found" });
  if (!name) return res.status(400).json({ message: "'name' is required" });

  const participants = call.participants;

  if (participants.find(({ identity: id }) => id === _id)) {
    guest = await Guest.findOneAndUpdate(
      { _id },
      { $set: { name } },
      { new: true, upsert: true }
    );
    if (guest)
      return res.status(200).json({
        message: "Guest  already exits",
        name,
        token: jwt.sign({ _id, isGuest: true }),
        _id,
      });
  }

  try {
    while (_id ? await getGuest(_id) : true)
      _id ??= new Types.ObjectId().toString();

    if (!Types.ObjectId.isValid(_id))
      return res.status(400).json({ message: "'id' is invalid" });

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

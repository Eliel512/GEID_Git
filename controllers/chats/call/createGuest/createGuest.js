// @ts-check
/// <reference path="../../../../types/callSession.type.js" />
/// <reference path="../../../../types/guest.type.js" />
const jwt = require("../../../../tools/jwt");
const CallSession = require("../../../../models/chats/callSession.model");
const Guest = require("../../../../models/chats/guests.model");

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const createGuest = async (req, res) => {
  /**@type {string} */
  const roomId = req.body?.roomId;
  /**@type {string} */
  let userId = req.body?.id;
  /**@type {string} */
  const name = req.body?.name;

  /**@type {GuestUserDocument} */
  let guest;
  if (!roomId) return res.status(400).json({ message: "'roomId' is required" });

  /** @type {CallSessionDocument} */
  const call = await CallSession.findOne({ _id: roomId });

  if (!call) return res.status(404).json({ message: "Room not found" });

  const participants = call.participants;
  const id = participants.find(({ identity: id }) => id === userId)?.identity;

  if (userId === id) {
    guest = await Guest.findOne({ _id: userId });
    if (guest)
      return res.status(409).json({
        message: "Guest  already exits",
        name: guest.name,
        token: jwt.sign({ id: userId }),
      });
  }

  if (!name) return res.status(400).json({ message: "'name' is required" });

  try {
    guest = await Guest.create({ name: req.body?.name });
    userId = guest._id;
    await guest?.save();
    return res.status(200).json({
      message: "Guest created",
      name: req.body?.name,
      token: jwt.sign({ id: userId }),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred" });
  }
};

module.exports = createGuest;

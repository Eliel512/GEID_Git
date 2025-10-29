const { getGuestsFromRoomId } = require("../../../handlers/room/queryToJoin");
const callSession = require("../../../models/chats/callSession.model");
const getResolvedCallSession = require("../call/createRoom/getResolvedCallSession");

// const Chat = require('../../../models/chats/chat.model');
// const User = require('../../../models/users/user.model');
// const Guest = require('../../../models/chats/guests.model');
// const serverStore = require('../../../serverStore');

module.exports = async (req, res) => {
  const roomId = req.params.id;
  const userId = res.locals.userId;

  if (!roomId) return res.status(400).json({ message: "'roomId' is required" });

  try {
    const call = await getResolvedCallSession(roomId);
    if (!call) return res.status(404).json({ message: "Call not found" });
    const participants = call.participants;

    let restrictedCall;
    let guests;

    if (participants.find((p) => p.identity._id.toString() === userId)) {
      const organizers = call.participants.filter((p) => p.state.isOrganizer);

      const isOrgFunc = ({ identity: u }) => u._id?.toString() === userId;
      const mapGuestFunc = ({ userId, _id, roomId, ...u }) =>
        roomId && { ...u, _id: userId || _id };

      const isOrg = organizers?.some(isOrgFunc);
      let bulkGuests = isOrg ? await getGuestsFromRoomId(roomId) : [];
      guests = bulkGuests.map(mapGuestFunc);
    } else {
      restrictedCall = {};
      const keys = [
        "_id",
        "start",
        "duration",
        "summary",
        "description",
        "participants",
        "room",
        "createdBy",
      ];

      keys.forEach((k) => (restrictedCall[k] = call[k]));
    }
    return res.status(200).json(restrictedCall || { ...call, guests });
  } catch (e) {
    return res.status(500).json({ message: "An error occurred" });
  }
};

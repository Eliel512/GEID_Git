const { getGuestsFromRoomId } = require("../../../handlers/room/queryToJoin");
const callSession = require("../../../models/chats/callSession.model");

// const Chat = require('../../../models/chats/chat.model');
// const User = require('../../../models/users/user.model');
// const Guest = require('../../../models/chats/guests.model');
// const serverStore = require('../../../serverStore');

module.exports = (req, res) => {
  const roomId = req.params.id;
  const userId = res.locals.userId;
  callSession
    .findOne({ _id: roomId, "participants.identity": userId })
    .populate({
      path: "participants.identity",
      // model: doc => doc.itemsModel == 'users' ? User : Guest,
      select: "_id name fname mname lname email grade imageUrl",
    })
    .populate({
      path: "createdBy",
      select: "_id fname mname lname email grade imageUrl",
    })
    .exec(async (error, callDetails) => {
      if (error) {
        console.log(error);
        return res.status(500).json({
          message: "Une erreur est survenue",
        });
      }
      if (!callDetails) {
        callSession
          .findOne(
            { _id: req.params.id },
            {
              start: 1,
              duration: 1,
              summary: 1,
              room: 1,
              description: 1,
              "participants.identity": 1,
              "participants.itemModel": 1,
            }
          )
          .populate({
            path: "participants.identity",
            // model: doc => doc.itemsModel == 'users' ? User : Guest,
            select: "_id name fname lname mname email imageUrl grade",
          })
          .populate({
            path: "createdBy",
            select: "_id fname mname lname email grade imageUrl",
          })
          .exec((error, callDetails) => {
            if (error) {
              console.log(error);
              return res.status(500).json({
                message: "Une erreur est survenue",
              });
            }
            if (!callDetails) {
              return res.status(404).json({
                message: "Appel introuvable",
              });
            }
            return res.status(200).json(callDetails);
          });
      } else {
        const call = callDetails.toJSON();
        let guests;
        const isOrganizer = call.participants?.some(
          (participant) =>
            participant.identity._id === userId && participant.state.isOrganizer
        );
        if (isOrganizer)
          guests = (await getGuestsFromRoomId(roomId)).map((guest) => ({
            ...guest,
            roomId: undefined,
          }));
        res.status(200).json({
          ...call,
          guests,
          // guests: await getGuestsFromRoomId(roomId),
        });
      }
    });
};

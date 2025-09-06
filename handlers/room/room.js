const callSessionSchema = require("./callSessionSchema");
const socketStore = require("../../socketStore");
const CallSession = require("../../models/chats/callSession.model");

const roomId = "_friends";
class JoinRoom {
  /** @type {string|null} */
  #userId = null;
  /** @type {string|null} */
  #roomId = null;
  /**
   * @constructor
   * @param {import('socket.io').Socket} socket
   * @param {Object.<string, {id: string}>} data
   * @returns {(socket, data) => void}
   */
  constructor(socket, data) {
    return this.#join(socket, data);
  }
  /**
   * @param {import('socket.io').Socket} socket
   * @param {Object.<string, {id: string}>} data
   */
  #join = async (socket, data) => {
    this.#userId = socket.userId;
    this.#roomId = data.id;
    const sockets = await socketStore.getInstancesByRoomId(this.#roomId);

    const [client] = await socketStore.getClientRoomConnections(
      this.#roomId,
      this.#userId
    );

    const socketId = client?.socketId;
    const clientId = client?.clientId;

    if (clientId === this.#userId) {
      socket.emit("ask-room", {
        socketId,
        message: "A device is already connected to this room",
      });
      return;
    }

    for (let i = 0; i < sockets.length; i++) {
      if (socket.id === sockets[i].id) {
        socket.emit("error-room", {
          type: "conflit",
          message: "Client has already joined",
        });
        return;
      }
    }
    console.log("test ça marche");

    // try {
    //   const call = await CallSession.findOne({ _id: this.#roomId });
    //   const participants = call.participates;
    //   console.log("participants =>", participants);
    // } catch (e) {
    //   console.error(e);
    // }

    // socket.join(this.#roomId);
    // socketStore
    //   .getRoom(this.#roomId)
    //   .emit("join-room", { userId: this.#userId });

    // // define all events
    // socket.on("signal-room", this.signal);
    // socket.on("leave-room", this.leave);
    // socket.on("disconnect", () => this.leave(socket, data));

    // CallSession.findOne({
    //   _id: data.id /*, 'participants.identity': socket.userId*/,
    // })
    //   .then(async (callDetails) => {
    //     if (!callDetails) {
    //       const io = serverStore.getSocketServerInstance();
    //       return io.to(socket.id).emit("error", {
    //         message: "Appel introuvable",
    //       });
    //     }
    //     for (const participant of callDetails.participants) {
    //       if (
    //         participant.identity._id === socket.userId &&
    //         participant.state.isInRoom
    //       ) {
    //         const io = serverStore.getSocketServerInstance();
    //         return io.to(socket.id).emit("error", {
    //           message: "L'utilisateur figure deja dans l'appel",
    //         });
    //       }
    //     }
    //     if (
    //       callDetails.participants.some(
    //         (participant) => participant.identity == socket.userId
    //       )
    //     ) {
    //       socket.join(data.id);
    //       callDetails.participants.forEach((participant) => {
    //         if (participant.identity._id == socket.userId) {
    //           participant.state.isInRoom = true;
    //         }
    //       });
    //       if (!callDetails.room) {
    //         callDetails.status = 1;
    //       }
    //     } else if (callDetails.open) {
    //       let randomNumber;
    //       do {
    //         randomNumber = getRandomNumber(1, 10000);
    //       } while (
    //         callDetails.participants.some((participant) => {
    //           return participant.uid == randomNumber;
    //         })
    //       );
    //       randomNumbers.push(randomNumber);
    //       callDetails.participants = [
    //         ...callDetails.participants,
    //         {
    //           identity: socket.userId,
    //           uid: randomNumber,
    //           itemModel: socket.userId.length > 8 ? "users" : "guests",
    //           state: {
    //             isInRoom: true,
    //             isMicActive: false,
    //             isCamActive: false,
    //             handRaised: false,
    //             screenShared: false,
    //             isOrganizer: false,
    //           },
    //           auth: {
    //             shareScreen: callDetails.room ? false : true,
    //           },
    //         },
    //       ];
    //       if (!callDetails.room) {
    //         callDetails.status = 1;
    //       }
    //     } else {
    //       callDetails.guests = [
    //         ...callDetails.guests,
    //         {
    //           identity: socket.userId,
    //           itemModel: socket.userId.length > 8 ? "users" : "guests",
    //         },
    //       ];
    //     }
    //     callDetails
    //       .save()
    //       .then(async () => {
    //         try {
    //           let userDetails;
    //           if (socket.userId.length > 8) {
    //             userDetails = await User.findById(
    //               socket.userId,
    //               "_id fname mname lname email grade imageUrl"
    //             );
    //           } else {
    //             userDetails = await Guest.findOne(
    //               {
    //                 _id: socket.userId,
    //               },
    //               {
    //                 name: 1,
    //               }
    //             );
    //           }
    //           const io = serverStore.getSocketServerInstance();
    //           const event = callDetails.guests.some(
    //             (guest) => guest.identity == socket.userId
    //           )
    //             ? "guest"
    //             : "join";
    //           if (event == "guest") {
    //             const receiverList = serverStore.getActiveConnections(
    //               socket.userId
    //             );
    //             const organizers = callDetails.participants.filter(
    //               (part) => part.state.isOrganizer && part.state.isInRoom
    //             );
    //             organizers.forEach((organizer) => {
    //               receiverList.push(
    //                 ...serverStore.getActiveConnections(organizer.identity)
    //               );
    //             });
    //             receiverList.forEach((socketId) => {
    //               io.to(socketId).emit(event, {
    //                 who: userDetails,
    //                 where: {
    //                   _id: callDetails.id,
    //                   summary: callDetails.summary,
    //                   description: callDetails.description,
    //                 },
    //               });
    //             });
    //           } else {
    //             socket.join(data.id);
    //             io.to(data.id).emit(event, {
    //               who: userDetails,
    //               where: {
    //                 _id: callDetails.id,
    //                 summary: callDetails.summary,
    //                 description: callDetails.description,
    //               },
    //             });
    //             callDetails.participants.forEach((participant) => {
    //               const receiverList = serverStore.getActiveConnections(
    //                 participant.identity
    //               );
    //               receiverList.forEach((socketId) => {
    //                 io.to(socketId).emit("call-status", {
    //                   _id: callDetails._id,
    //                   status: callDetails.status,
    //                 });
    //               });
    //             });
    //           }
    //         } catch (error) {
    //           console.log(error);
    //           ErrorHandlers.msg(socket.id, "Une erreur est survenue");
    //         }
    //       })
    //       .catch((error) => {
    //         console.log(error);
    //         return ErrorHandlers.msg(socket.id, "Une erreur est survenue");
    //       });
    //   })
    //   .catch((error) => {
    //     console.log(error);
    //     return ErrorHandlers.msg(socket.id, "Une erreur est survenue");
    //   });
  };
  /**
   * @param {import('socket.io').Socket} socket
   * @param {Object.<string, {id: string}>} data
   */
  signal = async (socket, data) => {
    socketStore.getRoom(roomId).emit("signal-room", {
      userId: this.#userId,
      message: "Bonjour les gens",
    });
  };
  /**
   * @param {import('socket.io').Socket} socket
   * @param {Object.<string, {id: string}>} data
   */
  leave = async (socket, data) => {
    socketStore.getRoom(roomId).emit("leave-room", {
      userId: this.#userId,
    });
  };
}

module.exports = JoinRoom;

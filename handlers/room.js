const serverStore = require("../serverStore");
const Chat = require("../models/chats/chat.model");
const User = require("../models/users/user.model");
const Guest = require("../models/chats/guests.model");
const CallSession = require("../models/chats/callSession.model");
const icalToolkit = require("ical-toolkit");
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");
const crypto = require("crypto");
const Joi = require("joi");

const ErrorHandlers = require("./errors");
const update = require("./meeting");

const callSessionSchema = Joi.object({
  _id: Joi.string().min(6).max(6).required(),
  start: Joi.number().required(),
  duration: Joi.object({
    hours: Joi.number(),
    minutes: Joi.number(),
    seconds: Joi.number().required(),
  }).required(),
  summary: Joi.string(),
  description: Joi.string(),
  location: Joi.string().required(),
  participants: Joi.array().items(
    Joi.object({
      identity: Joi.string().required(),
      state: Joi.object({
        isOrganizer: Joi.boolean().required(),
        handRaised: Joi.boolean().required(),
        screenShared: Joi.boolean().required(),
        isCamActive: Joi.boolean(),
        isMicActive: Joi.boolean(),
        isInRoom: Joi.boolean().required(),
      }).required(),
      auth: Joi.object({
        shareScreen: Joi.boolean().required(),
      }).required(),
    }).required()
  ),
  callDetails: Joi.object({}).unknown().required(),
});

const delay = (time) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};

const sendMail = (targets, message, from, subject, alternatives) => {
  const smtpOptions = {
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.GEID_EMAIL,
      pass: process.env.GEID_PASS,
    },
  };
  const transporter = nodemailer.createTransport(smtpTransport(smtpOptions));

  for (let target of targets) {
    const mailOptions = {
      from: from,
      to: target.email,
      subject: subject,
      html: message,
      alternatives: alternatives,
    };

    // Envoyer le mail avec le transporteur défini
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log(`Invitation sent to ${target.email}: ${info.response}`);
      }
    });
  }
};

const generateId = (char) => {
  const uid = crypto.randomUUID();
  const hash = crypto.createHash("sha1").update(uid).digest("hex");
  return hash.slice(0, char);
};

const getRandomNumber = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

module.exports = {
  scheduleHandler: async (socket, data) => {
    const userId = socket.userId;
    let userDetails;
    let message;
    let attendees;

    const builder = icalToolkit.createIcsFileBuilder();
    builder.method = "REQUEST";
    // Définir les propriétés du fichier
    builder.spacers = true; // Ajouter des espaces vides pour une meilleure lisibilité
    builder.NEWLINE_CHAR = "\r\n";

    try {
      userDetails = await User.findById(
        userId,
        "fname mname lname grade email"
      );
      const roomDetails = await Chat.findById(
        data.to,
        "name description members._id"
      );
      if (!roomDetails) {
        ErrorHandlers.msg(socket.id, "Lisanga introuvable.");
      }
      attendees = roomDetails.members.map(async (member) => {
        return await User.findById(member._id, "fname mname lname grade email");
      });
      attendees = await Promise.all(attendees);

      builder.events.push({
        start: data.start,
        duration: {
          minutes: data.duration,
        },
        summary: data.summary,
        description: data.description,
        location: `GEID Lisolo Na Budget\n\tLisanga ${roomDetails.name.toString()}\n\t${
          roomDetails.description
        }`,
        organizer: {
          name: `${userDetails.lname} ${userDetails.mname} ${userDetails.fname}`,
          email: userDetails.email,
        },
        attendees: attendees.map((attendee) => ({
          name: `${attendee.lname} ${attendee.mname} ${attendee.fname}`,
          email: attendee.email,
          rsvp: true,
        })),
      });

      const start = new Date(Number(data.start)).toLocaleString("fr-FR");

      message = `Bonjour,<br><br>Vous êtes invité à participer à la réunion suivante:<br><br>Sujet: ${
        data.summary
      }<br>Description: ${
        data.description
      }<br>Date et heure: ${start}<br>durée: ${
        data.duration
      } minutes<br>Lieu: GEID Lisolo Na Budget: Lisanga ${roomDetails.name.toString()}<br>Organisateur: ${
        userDetails.lname
      } ${
        userDetails.fname
      }<br><br>Merci de confirmer votre présence en cliquant sur le bouton ci-dessous.<br><br>Cordialement,<br>${
        userDetails.lname
      } ${userDetails.fname}`;
    } catch (error) {
      console.log(error);
      ErrorHandlers.msg(socket.id, "Une erreur est survenue");
    }

    const icsFileContent = builder.toString();
    const alternatives = [
      {
        contentType: 'text/calendar; charset="utf-8"; method=REQUEST',
        content: icsFileContent.toString(),
      },
    ];

    sendMail(
      attendees,
      message,
      userDetails.email,
      `Invitation à la réunion: ${data.summary}`,
      alternatives
    );

    update.updatePendingMeetings(data.to, data);
  },
  createHandler: async (socket, data) => {
    const userId = socket.userId;

    const callDetails = data.details;
    let roomId;
    let roomDetails;

    try {
      roomDetails = await Chat.findOne(
        { _id: data.to, type: "room" },
        { name: 1, description: 1, "members._id": 1 }
      );
      if (!roomDetails) {
        return ErrorHandlers.msg(socket.id, "Lisanga introuvable.");
      }

      do {
        roomId = generateId(9);
      } while (await CallSession.exists({ _id: roomId }));
    } catch (error) {
      console.log(error);
      return ErrorHandlers.msg(socket.id, "Une erreur est survenue");
    }

    const { error, value } = callSessionSchema.validate({
      _id: roomId,
      start: Number(data.start) || Date.now(),
      duration: {
        seconds: 0,
      },
      summary: data.summary,
      description: data.description,
      location: roomDetails._id.toString(),
      participants: roomDetails.members.map((participant) => {
        return {
          identity: participant._id.toString(),
          state: {
            isOrganizer: participant._id === userId ? true : false,
            handRaised: false,
            screenShared: false,
            isMicActive:
              participant._id === userId
                ? Boolean(data.state.isMicActive)
                : undefined,
            isCamActive:
              participant._id === userId
                ? Boolean(data.state.isCamActive)
                : undefined,
            isInRoom: participant._id === userId ? true : false,
          },
          auth: {
            shareScreen: participant._id === userId ? true : false,
          },
        };
      }),
      callDetails: {
        ...callDetails,
      },
    });
    if (error) {
      console.log(error.details);
      return ErrorHandlers.msg(socket.id, error.details);
    }

    const callSessionObject = new CallSession({
      ...value,
    });

    callSessionObject
      .save()
      .then(async () => {
        socket.join(roomId);
        try {
          const userDetails = await User.findById(
            userId,
            "_id fname mname lname grade email"
          );
          const io = serverStore.getSocketServerInstance();
          io.to(roomId).emit("new-connexion", {
            who: userDetails,
            where: {
              _id: roomId,
              summary: callSessionObject.summary,
              description: callSessionObject.description,
              location: callSessionObject.location,
            },
          });
        } catch (error) {
          console.log(error);
          ErrorHandlers.msg(socket.id, "Une erreur est survenue");
        }
      })
      .catch((err) => {
        console.log(err);
        return ErrorHandlers.msg(socket.id, "Une erreur est survenue");
      });
  },
  joinRoom: (socket, data) => {
    CallSession.findOne({
      _id: data.id /*, 'participants.identity': socket.userId*/,
    })
      .then(async (callDetails) => {
        if (!callDetails) {
          const io = serverStore.getSocketServerInstance();
          return io.to(socket.id).emit("error", {
            message: "Appel introuvable",
          });
        }
        for (const participant of callDetails.participants) {
          if (
            participant.identity._id === socket.userId &&
            participant.state.isInRoom
          ) {
            const io = serverStore.getSocketServerInstance();
            return io.to(socket.id).emit("error", {
              message: "L'utilisateur figure deja dans l'appel",
            });
          }
        }
        if (
          callDetails.participants.some(
            (participant) => participant.identity == socket.userId
          )
        ) {
          socket.join(data.id);
          callDetails.participants.forEach((participant) => {
            if (participant.identity._id == socket.userId) {
              participant.state.isInRoom = true;
            }
          });
          if (!callDetails.room) {
            callDetails.status = 1;
          }
        } else if (callDetails.open) {
          let randomNumber;
          do {
            randomNumber = getRandomNumber(1, 10000);
          } while (
            callDetails.participants.some((participant) => {
              return participant.uid == randomNumber;
            })
          );
          randomNumbers.push(randomNumber);
          callDetails.participants = [
            ...callDetails.participants,
            {
              identity: socket.userId,
              uid: randomNumber,
              itemModel: socket.userId.length > 8 ? "users" : "guests",
              state: {
                isInRoom: true,
                isMicActive: false,
                isCamActive: false,
                handRaised: false,
                screenShared: false,
                isOrganizer: false,
              },
              auth: {
                shareScreen: callDetails.room ? false : true,
              },
            },
          ];
          if (!callDetails.room) {
            callDetails.status = 1;
          }
        } else {
          callDetails.guests = [
            ...callDetails.guests,
            {
              identity: socket.userId,
              itemModel: socket.userId.length > 8 ? "users" : "guests",
            },
          ];
        }
        callDetails
          .save()
          .then(async () => {
            try {
              let userDetails;
              if (socket.userId.length > 8) {
                userDetails = await User.findById(
                  socket.userId,
                  "_id fname mname lname email grade imageUrl"
                );
              } else {
                userDetails = await Guest.findOne(
                  {
                    _id: socket.userId,
                  },
                  {
                    name: 1,
                  }
                );
              }
              const io = serverStore.getSocketServerInstance();
              const event = callDetails.guests.some(
                (guest) => guest.identity == socket.userId
              )
                ? "guest"
                : "join";
              if (event == "guest") {
                const receiverList = serverStore.getActiveConnections(
                  socket.userId
                );
                const organizers = callDetails.participants.filter(
                  (part) => part.state.isOrganizer && part.state.isInRoom
                );
                organizers.forEach((organizer) => {
                  receiverList.push(
                    ...serverStore.getActiveConnections(organizer.identity)
                  );
                });
                receiverList.forEach((socketId) => {
                  io.to(socketId).emit(event, {
                    who: userDetails,
                    where: {
                      _id: callDetails.id,
                      summary: callDetails.summary,
                      description: callDetails.description,
                    },
                  });
                });
              } else {
                socket.join(data.id);
                io.to(data.id).emit(event, {
                  who: userDetails,
                  where: {
                    _id: callDetails.id,
                    summary: callDetails.summary,
                    description: callDetails.description,
                  },
                });
                callDetails.participants.forEach((participant) => {
                  const receiverList = serverStore.getActiveConnections(
                    participant.identity
                  );
                  receiverList.forEach((socketId) => {
                    io.to(socketId).emit("call-status", {
                      _id: callDetails._id,
                      status: callDetails.status,
                    });
                  });
                });
              }
            } catch (error) {
              console.log(error);
              ErrorHandlers.msg(socket.id, "Une erreur est survenue");
            }
          })
          .catch((error) => {
            console.log(error);
            return ErrorHandlers.msg(socket.id, "Une erreur est survenue");
          });
      })
      .catch((error) => {
        console.log(error);
        return ErrorHandlers.msg(socket.id, "Une erreur est survenue");
      });
  },
  accept: (socket, data) => {
    CallSession.findOne({
      _id: data.where,
      participants: {
        $elemMatch: { identity: socket.userId, "state.isOrganizer": true },
      },
    })
      .then((callDetails) => {
        if (!callDetails) {
          return ErrorHandlers.msg(socket.id, "Operation impossible");
        }
        if (callDetails.guests.every((guest) => guest.identity != data.who)) {
          return ErrorHandlers.msg(socket.id, "Invite introuvable");
        }
        const guestSocket = serverStore.getUserSocketInstance(data.who).socket;
        if (!guestSocket) {
          return ErrorHandlers.msg(socket.id, "Invite introuvable");
        }
        callDetails.guests = callDetails.guests.filter(
          (guest) => guest.identity !== data.who
        );
        let randomNumber;
        do {
          randomNumber = getRandomNumber(1, 10000);
        } while (
          callDetails.participants.some((participant) => {
            return participant.uid == randomNumber;
          })
        );
        callDetails.participants = [
          ...callDetails.participants,
          {
            identity: data.who,
            uid: randomNumber,
            itemModel: data.who.length > 8 ? "users" : "guests",
            state: {
              isOrganizer: false,
              isCamActive: false,
              isMicActive: false,
              screenShared: false,
              handRaised: false,
              isInRoom: true,
            },
            auth: {
              shareScreen: callDetails.room ? false : true,
            },
          },
        ];
        if (!callDetails.room && callDetails.status == 0) {
          callDetails.status = 1;
        }
        callDetails
          .save()
          .then(async () => {
            let userDetails;
            try {
              if (data.who.length > 8) {
                userDetails = await User.findById(
                  data.who,
                  "_id fname mname lname email grade imageUrl"
                );
              } else {
                userDetails = await Guest.findOne(
                  {
                    _id: data.who,
                  },
                  {
                    name: 1,
                  }
                );
              }
            } catch (error) {
              console.log(error);
              return ErrorHandlers.msg(socket.id, "Une erreur est survenue");
            }
            guestSocket.join(data.where);
            const io = serverStore.getSocketServerInstance();
            io.to(data.where).emit("join", {
              who: {
                ...userDetails._doc,
                isGuest: true,
              },
              details: {
                identity: userDetails,
                uid: randomNumber,
                itemModel: data.who.length > 8 ? "users" : "guests",
                state: {
                  isOrganizer: false,
                  isCamActive: false,
                  isMicActive: false,
                  screenShared: false,
                  handRaised: false,
                  isInRoom: true,
                },
                auth: {
                  shareScreen: callDetails.room ? false : true,
                },
              },
              where: {
                _id: callDetails.id,
                summary: callDetails.summary,
                description: callDetails.description,
              },
            });
            callDetails.participants.forEach((participant) => {
              const receiverList = serverStore.getActiveConnections(
                participant.identity
              );
              receiverList.forEach((socketId) => {
                io.to(socketId).emit("call-status", {
                  _id: callDetails._id,
                  status: callDetails.status,
                });
              });
            });
          })
          .catch((error) => {
            console.log(error);
            ErrorHandlers.msg(socket.id, "Une erreur est survenue");
          });
      })
      .catch((error) => {
        console.log(error);
        return ErrorHandlers.msg(socket.id, "Une erreur est survenue");
      });
  },
  leaveRoom: (socket, data) => {
    CallSession.findOne({
      _id: data.id,
      "participants.identity": socket.userId,
    })
      .then(async (callDetails) => {
        if (!callDetails) {
          const io = serverStore.getSocketServerInstance();
          return io.to(socket.id).emit("error", {
            message: "Appel introuvable",
          });
        }
        for (const participant of callDetails.participants) {
          if (
            participant.identity === socket.userId &&
            !participant.state.isInRoom
          ) {
            const io = serverStore.getSocketServerInstance();
            return io.to(socket.id).emit("error", {
              message: "L'utilisateur ne figure pas dans l'appel",
            });
          }
        }
        socket.leave(data.id);
        callDetails.participants.forEach((participant) => {
          if (participant.identity === socket.userId) {
            participant.state.isInRoom = false;
          }
        });
        if (callDetails.room) {
        } else {
          callDetails.status = 2;
        }
        callDetails
          .save()
          .then(async () => {
            try {
              const userDetails = await User.findById(
                socket.userId,
                "_id fname mname lname grade email"
              );
              const io = serverStore.getSocketServerInstance();
              io.to(data.id).emit("leave", {
                who: userDetails,
                where: {
                  _id: callDetails.id,
                  summary: callDetails.summary,
                  description: callDetails.description,
                },
              });
            } catch (error) {
              console.log(error);
              ErrorHandlers.msg(socket.id, "Une erreur est survenue");
            }
          })
          .catch((error) => {
            console.log(error);
            return ErrorHandlers.msg(socket.id, "Une erreur est survenue");
          });
      })
      .catch((error) => {
        console.log(error);
        return ErrorHandlers.msg(socket.id, "Une erreur est survenue");
      });
  },
  signal: (socket, data) => {
    CallSession.findOne({
      _id: data.id,
      "participants.identity": socket.userId,
    })
      .then(async (callDetails) => {
        const io = serverStore.getSocketServerInstance();
        if (!callDetails) {
          return io.to(socket.id).emit("error", {
            message: "Appel introuvable",
          });
        }
        if (data.who.length != 1 || !data.who.includes(socket.userId)) {
          if (
            !callDetails.participants.some(
              (part) => part.identity == socket.userId && part.state.isOrganizer
            )
          ) {
            return ErrorHandlers.msg(socket.id, "Operation impossible");
          }
        }
        switch (data.type) {
          case "state":
            callDetails.participants.forEach((member) => {
              if (data.who.includes(member.identity)) {
                member.state = {
                  ...member.state,
                  ...data.obj,
                };
              }
            });
            break;
          case "auth":
            callDetails.participants.forEach((member) => {
              if (data.who.includes(member.identity)) {
                member.auth = {
                  ...member.auth,
                  ...data.obj,
                };
              }
            });
            break;
          default:
            return io.to(socket.id).emit("error", {
              message: "'type' incorrect",
            });
        }
        // let userDetails;
        // try {
        //     if (socket.userId.length > 8) {
        //         userDetails = await User.findById(socket.userId,
        //             '_id fname mname lname email grade imageUrl');
        //     } else {
        //         userDetails = await Guest.findOne({
        //             _id: socket.userId
        //         }, {
        //             name: 1
        //         });
        //     }
        // } catch (error) {
        //     console.log(error);
        //     return ErrorHandlers.msg(socket.id, 'Une erreur est survenue');
        // }
        io.to(data.id).emit("signal", {
          who: data.who,
          where: {
            _id: callDetails.id,
            summary: callDetails.summary,
            description: callDetails.description,
          },
          what: {
            [data.type]: {
              ...data.obj,
            },
          },
        });
      })
      .catch((err) => {
        console.log(err);
        return ErrorHandlers.msg(socket.id, "Une erreur est survenue");
      });
  },
  ringHandler: async (socket, data) => {
    const userDetails = await User.findById(
      socket.userId,
      "_id fname mname lname grade email imageUrl"
    );
    const callDetails = await CallSession.findById(
      data.id,
      "_id summary description location"
    );
    if (!callDetails) {
      const receiverList = serverStore.getActiveConnections(socket.userId);

      const io = serverStore.getSocketServerInstance();

      receiverList.forEach((socketId) => {
        io.to(socketId).emit("error", {
          message: "Appel introuvable",
        });
      });
    }
    const location = data.type == "direct" ? data.target : callDetails.location;
    delete callDetails.location;

    const io = serverStore.getSocketServerInstance();
    io.to(data.id).emit("ringing", {
      who: userDetails,
      where: {
        ...callDetails,
        location: location,
      },
      data: data.data,
    });
  },
  busyHandler: async (socket, data) => {
    const userDetails = await User.findById(
      socket.userId,
      "_id fname mname lname grade email imageUrl"
    );
    const callDetails = await CallSession.findById(
      data.id,
      "_id summary description location"
    );
    if (!callDetails) {
      const receiverList = serverStore.getActiveConnections(socket.userId);

      const io = serverStore.getSocketServerInstance();

      receiverList.forEach((socketId) => {
        io.to(socketId).emit("error", {
          message: "Appel introuvable",
        });
      });
    }
    const location = data.type == "direct" ? data.target : callDetails.location;
    delete callDetails.location;

    const io = serverStore.getSocketServerInstance();
    io.to(data.id).emit("busy", {
      who: userDetails,
      where: {
        ...callDetails,
        location: location,
      },
    });
  },
  hangUpHandler: async (socket, data) => {
    CallSession.findOne({
      _id: data.id,
      "participants.identity": socket.userId,
    })
      .then(async (callDetails) => {
        if (!callDetails) {
          const io = serverStore.getSocketServerInstance();
          return io.to(socket.id).emit("error", {
            message: "Appel introuvable",
          });
        }
        let userDetails;
        try {
          if (socket.userId.length > 8) {
            userDetails = await User.findById(
              socket.userId,
              "_id fname mname lname email grade imageUrl"
            );
          } else {
            userDetails = await Guest.findOne(
              {
                _id: socket.userId,
              },
              {
                name: 1,
              }
            );
          }
        } catch (error) {
          console.log(error);
          return ErrorHandlers.msg(socket.id, "Une erreur est survenue");
        }
        for (const participant of callDetails.participants) {
          if (
            participant.identity == socket.userId &&
            !participant.state.isInRoom
          ) {
            const io = serverStore.getSocketServerInstance();
            return io.to(data.id).emit("hang-up", {
              who: userDetails,
              where: {
                _id: callDetails._id,
                summary: callDetails.summary,
                description: callDetails.description,
                location:
                  data.type == "direct" ? data.target : callDetails.location,
              },
            });
          }
        }
        socket.leave(data.id);
        callDetails.participants.forEach((participant) => {
          if (participant.identity == socket.userId) {
            participant.state.isInRoom = false;
          }
        });
        if (!callDetails.room) {
          callDetails.status = callDetails.status == 0 ? 2 : 3;
        } else {
          if (
            callDetails.participants.every(
              (participant) => participant.state.isInRoom == false
            )
          ) {
            callDetails.status = 3;
          }
        }
        callDetails
          .save()
          .then(async () => {
            try {
              let userDetails;
              if (socket.userId.length > 8) {
                userDetails = await User.findById(
                  socket.userId,
                  "_id fname mname lname email grade imageUrl"
                );
              } else {
                userDetails = await Guest.findOne(
                  {
                    _id: socket.userId,
                  },
                  {
                    name: 1,
                  }
                );
              }
              const io = serverStore.getSocketServerInstance();
              const rooms = io.sockets.adapter.rooms;

              const receiverList = rooms.has(data.id)
                ? [data.id]
                : serverStore.getActiveConnections(data.target);

              receiverList.forEach((socket) => {
                io.to(socket).emit("hang-up", {
                  who: userDetails,
                  where: {
                    _id: callDetails._id,
                    summary: callDetails.summary,
                    description: callDetails.description,
                    location:
                      data.type == "direct"
                        ? data.target
                        : callDetails.location,
                  },
                });
              });

              callDetails.participants.forEach((participant) => {
                const receiverList = serverStore.getActiveConnections(
                  participant.identity
                );
                receiverList.forEach((socketId) => {
                  io.to(socketId).emit("call-status", {
                    _id: callDetails._id,
                    status: callDetails.status,
                  });
                });
              });
            } catch (error) {
              console.log(error);
              ErrorHandlers.msg(socket.id, "Une erreur est survenue");
            }

            let toDelete = true;

            for (let i = 0; i < callDetails.participants.length; i++) {
              if (callDetails.participants[i].isInRoom) {
                toDelete = false;
                break;
              }
            }
            // if(toDelete){
            //     CallSession.deleteOne({ _id: data.id })
            //         .catch(error => {
            //             console.log(error);
            //             return ErrorHandlers.msg(socket.id, 'Une erreur est survenue');
            //         });
            // }
          })
          .catch((error) => {
            console.log(error);
            return ErrorHandlers.msg(socket.id, "Une erreur est survenue");
          });
      })
      .catch((error) => {
        console.log(error);
        return ErrorHandlers.msg(socket.id, "Une erreur est survenue");
      });
  },
  edit: async (socket, data) => {
    const userId = socket.userId;
    switch (data.verb) {
      case "name":
        Chat.findOneAndUpdate({}, {}, { new: true })
          .then((chat) => {
            if (!chat) {
              return socket.emit("error", {
                message: "Operation impossible",
              });
            }
            chat.members.forEach((member) => {
              const receiverList = serverStore.getActiveConnections(member._id);
              receiverList.forEach((socketId) => {
                io.to(socketId).emit("edit-room", {
                  _id: chat._id,
                  verb: data.verb,
                  name: chat.name,
                });
              });
            });
          })
          .catch((error) => {
            console.log(error);
            return ErrorHandlers.msg(socket.id, "Une erreur est survenue");
          });
        break;
    }
  },
  callMessageHandler: async (socket, data) => {
    const { to, content, date, ref, clientId } = data;
    const userId = socket.userId;

    if (!content) {
      return ErrorHandlers.msg(
        socket.id,
        "Impossible d'envoyer un message vide."
      );
    }
    let userDetails;
    try {
      if (userId.length > 8) {
        userDetails = await User.findById(
          userId,
          "_id fname mname lname email grade imageUrl"
        );
      } else {
        userDetails = await Guest.findOne(
          {
            _id: userId,
          },
          {
            name: 1,
          }
        );
      }
    } catch (error) {
      console.log(error);
      return ErrorHandlers.msg(socket.id, "Une erreur est survenue.");
    }

    const message = {
      content: content,
      sender: userDetails,
      createdAt: date || Date.now(),
      clientId: clientId,
      ref: ref,
    };

    CallSession.updateOne(
      { _id: to, "participants.identity": userId },
      { $push: { messages: message } }
    )
      .then(() => {
        const io = serverStore.getSocketServerInstance();
        io.to(data.to).emit("call-message", {
          message: message,
          where: {
            _id: to,
          },
        });
      })
      .catch((error) => {
        console.log(error);
        ErrorHandlers.msg(socket.id, "Une erreur est survenue");
      });
  },
  disconnectHandler: async (socket) => {
    const userId = socket.userId;
    if (socket.userId.length > 8) {
      User.updateOne({ _id: userId }, { $set: { connected_at: Date.now() } })
        .then(async () => {
          const receiverList = [];
          const userDetails = await User.findOne(
            { _id: userId },
            { connected_at: 1, contacts: 1 }
          );
          userDetails.contacts.forEach((contact) => {
            receiverList.push(...serverStore.getActiveConnections(contact));
          });
          const io = serverStore.getSocketServerInstance();
          receiverList.forEach((socketId) => {
            io.to(socketId).emit("status", {
              who: userId,
              status: userDetails.connected_at,
            });
          });
        })
        .catch((error) => {
          console.log(error);
          ErrorHandlers.msg(socket.id, "Une erreur est survenue.");
        });
    }

    // CallSession.find({
    //   participants: {
    //     $elemMatch: {
    //       identity: userId,
    //       "state.isInRoom": true,
    //     },
    //   },
    // })
    //   .then(async (sessions) => {
    //     if (sessions.length === 0) {
    //       return;
    //     }
    //     let userDetails = null;

    //     for (const session of sessions) {
    //       let updated = false;

    //       // Mettre isInRoom à false pour le user concerné
    //       session.participants = session.participants.map((participant) => {
    //         if (
    //           participant.identity === userId &&
    //           participant.state.isInRoom === true
    //         ) {
    //           participant.state.isInRoom = false;
    //           updated = true;
    //         }
    //         return participant;
    //       });

    //       // Vérifier si tous les participants sont hors de la room
    //       const stillInRoom = session.participants.some(
    //         (p) => p.state.isInRoom
    //       );
    //       if (!stillInRoom) {
    //         session.status = 2;
    //         updated = true;
    //       }

    //       if (updated) {
    //         await session.save();
    //         try {
    //           userDetails ??= await User.findById(
    //             socket.userId,
    //             "_id fname mname lname grade email"
    //           );
    //           const io = serverStore.getSocketServerInstance();
    //           // console.log("LOG:", socket.userId, " à quitté", session?.id);
    //           io.to(session?.id).emit("leave", {
    //             who: userDetails,
    //             where: {
    //               _id: sessions.id,
    //               summary: sessions.summary,
    //               description: sessions.description,
    //             },
    //           });
    //         } catch (error) {
    //           console.log(error);
    //           ErrorHandlers.msg(socket.id, "Une erreur est survenue");
    //         }
    //       }
    //     }
    //   })
    //   .catch(() => {
    //     return ErrorHandlers.msg(socket.id, "Une erreur est survenue");
    //   });

    // CallSession
    //   .find({ "participants.identity": userId })
    //   .then((callSessions) => {
    //     callSessions.forEach(async (CallSession) => {
    //       CallSession.participants.forEach((participant) => {
    //         if (participant.identity == userId && participant.state.isInRoom) {
    //           participant.state.isInRoom = false;
    //         }
    //       });
    //       // await CallSession.save();
    //     });
    //     /*callSessions.save()
    //                 .then(() => {*/
    //     callSessions.forEach((call) => {
    //       let toDelete = true;
    //       for (let i = 0; i < call.participants.length; i++) {
    //         if (call.participants[i].isInRoom) {
    //           toDelete = false;
    //           break;
    //         }
    //       }
    //       if (toDelete) {
    //         CallSession.deleteOne({ _id: call._id }).catch((error) => {
    //           console.log(error);
    //           return ErrorHandlers.msg(socket.id, "Une erreur est survenue");
    //         });
    //       }
    //     });
    //     /*})
    //                 .catch(error => {
    //                     console.log(error);
    //                     ErrorHandlers.msg(socket.id, 'Une erreur est survenue');
    //                 });*/
    //   })
    //   .catch((error) => {
    //     console.log(error);
    //     ErrorHandlers.msg(socket.id, "Une erreur est survenue");
    //   });

    serverStore.removeConnectedUser(socket.id);
  },
};

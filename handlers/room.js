const serverStore = require('../serverStore');
const Chat = require('../models/chats/chat.model');
const User = require('../models/users/user.model');
const callSession = require('../models/chats/callSession.model');
const icalToolkit = require("ical-toolkit");
const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");
const crypto = require('crypto');
const Joi = require('joi');

const ErrorHandlers = require('./errors');
const update = require('./meeting');

const callSessionSchema = Joi.object({
    _id: Joi.string()
        .min(6)
        .max(6)
        .required(),
    start: Joi.number()
        .required(),
    duration: Joi.object({
        hours: Joi.number(),
        minutes: Joi.number(),
        seconds: Joi.number()
            .required()
    })
        .required(),
    summary: Joi.string(),
    description: Joi.string(),
    location: Joi.string()
        .required(),
    participants: Joi.array().items(
        Joi.object({
            identity: Joi.string()
                .required(),
            state: Joi.object({
                isOrganizer: Joi.boolean()
                    .required(),
                handRaised: Joi.boolean()
                    .required(),
                screenShared: Joi.boolean()
                    .required(),
                isCamActive: Joi.boolean(),
                isMicActive: Joi.boolean(),
                isInRoom: Joi.boolean()
                    .required()
            })
                .required(),
            auth: Joi.object({
                shareScreen: Joi.boolean()
                    .required()
            })
                .required()
        })
            .required(),
    ),
    callDetails: Joi.object({})
        .unknown()
        .required()
});

const delay = time => {
    return new Promise(resolve => setTimeout(resolve, time));
}

const sendMail = (targets, message, from, subject, alternatives) => {
    const smtpOptions = {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.GEID_EMAIL,
            pass: process.env.GEID_PASS
        }
    };
    const transporter = nodemailer.createTransport(smtpTransport(smtpOptions));

    for (let target of targets) {
        const mailOptions = {
            from: from,
            to: target.email,
            subject: subject,
            html: message,
            alternatives: alternatives
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
    const hash = crypto.createHash('sha1').update(uid).digest('hex');
    return hash.slice(0, char);
};

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
        builder.NEWLINE_CHAR = '\r\n';

        try {
            userDetails = await User.findById(userId, 'fname mname lname grade email');
            const roomDetails = await Chat.findById(data.to, 'name description members._id');
            if (!roomDetails) {
                ErrorHandlers.msg(socket.id, 'Lisanga introuvable.');
            }
            attendees = roomDetails.members.map(async member => {
                return await User.findById(member._id, 'fname mname lname grade email');
            });
            attendees = await Promise.all(attendees);

            builder.events.push({
                start: data.start,
                duration: {
                    minutes: data.duration
                },
                summary: data.summary,
                description: data.description,
                location: `GEID Lisolo Na Budget\n\tLisanga ${roomDetails.name.toString()}\n\t${roomDetails.description}`,
                organizer: {
                    name: `${userDetails.lname} ${userDetails.mname} ${userDetails.fname}`,
                    email: userDetails.email
                },
                attendees: attendees.map(attendee => ({
                    name: `${attendee.lname} ${attendee.mname} ${attendee.fname}`,
                    email: attendee.email,
                    rsvp: true
                }))
            });

            const start = new Date(Number(data.start)).toLocaleString('fr-FR');

            message = `Bonjour,<br><br>Vous êtes invité à participer à la réunion suivante:<br><br>Sujet: ${data.summary}<br>Description: ${data.description}<br>Date et heure: ${start}<br>durée: ${data.duration} minutes<br>Lieu: GEID Lisolo Na Budget: Lisanga ${roomDetails.name.toString()}<br>Organisateur: ${userDetails.lname} ${userDetails.fname}<br><br>Merci de confirmer votre présence en cliquant sur le bouton ci-dessous.<br><br>Cordialement,<br>${userDetails.lname} ${userDetails.fname}`;

        } catch (error) {
            console.log(error);
            ErrorHandlers.msg(socket.id, 'Une erreur est survenue');
        }

        const icsFileContent = builder.toString();
        const alternatives = [
            {
                contentType:
                    "text/calendar; charset=\"utf-8\"; method=REQUEST",
                content: icsFileContent.toString()
            }
        ];

        sendMail(attendees, message, userDetails.email, `Invitation à la réunion: ${data.summary}`, alternatives);

        update.updatePendingMeetings(data.to, data);

    },
    createHandler: async (socket, data) => {
        const userId = socket.userId;

        const callDetails = data.details;
        let roomId;
        let roomDetails;

        try {
            roomDetails = await Chat.findOne(
                { _id: data.to, type: 'room' }, { name: 1, description: 1, 'members._id': 1 }
            );
            if (!roomDetails) {
                return ErrorHandlers.msg(socket.id, 'Lisanga introuvable.');
            }

            do {
                roomId = generateId(9);
            } while (await callSession.exists({ _id: roomId }));
        } catch (error) {
            console.log(error);
            return ErrorHandlers.msg(socket.id, 'Une erreur est survenue');
        }

        const { error, value } = callSessionSchema.validate({
            _id: roomId,
            start: Number(data.start) || Date.now(),
            duration: {
                seconds: 0
            },
            summary: data.summary,
            description: data.description,
            location: roomDetails._id.toString(),
            participants: roomDetails.members.map(participant => {
                return {
                    identity: participant._id.toString(),
                    state: {
                        isOrganizer: participant._id === userId ? true : false,
                        handRaised: false,
                        screenShared: false,
                        isMicActive: participant._id === userId ? Boolean(data.state.isMicActive) : undefined,
                        isCamActive: participant._id === userId ? Boolean(data.state.isCamActive) : undefined,
                        isInRoom: participant._id === userId ? true : false
                    },
                    auth: {
                        shareScreen: participant._id === userId ? true : false
                    }
                }
            }),
            callDetails: {
                ...callDetails
            }
        });
        if (error) {
            console.log(error.details);
            return ErrorHandlers.msg(socket.id, error.details);
        }

        const callSessionObject = new callSession({
            ...value
        });

        callSessionObject.save()
            .then(async () => {
                socket.join(roomId);
                try {
                    const userDetails = await User.findById(userId, '_id fname mname lname grade email');
                    const io = serverStore.getSocketServerInstance();
                    io.to(roomId).emit('new-connexion', {
                        who: userDetails,
                        where: {
                            _id: roomId,
                            summary: callSessionObject.summary,
                            description: callSessionObject.description,
                            location: callSessionObject.location
                        }
                    });
                } catch (error) {
                    console.log(error);
                    ErrorHandlers.msg(socket.id, 'Une erreur est survenue');
                }
            })
            .catch(err => {
                console.log(err);
                return ErrorHandlers.msg(socket.id, 'Une erreur est survenue');
            });

    },
    joinRoom: (socket, data) => {
        callSession.findOne({ _id: data.id, 'participants.identity': socket.userId })
            .then(async callDetails => {
                if (!callDetails) {
                    const io = serverStore.getSocketServerInstance();
                    return io.to(socket.id).emit('error', {
                        message: 'Appel introuvable'
                    });
                }
                for(const participant of callDetails.participants){
                    if ((participant.identity === socket.userId) && participant.state.isInRoom) {
                        const io = serverStore.getSocketServerInstance()
                        return io.to(socket.id).emit('error', {
                            message: 'L\'utilisateur figure deja dans l\'appel'
                        });
                    }
                }
                socket.join(data.id);
                callDetails.participants.forEach(participant => {
                    if (participant.identity === socket.userId) {
                        participant.state.isInRoom = true
                    }
                });
                callDetails.save()
                    .then(async () => {
                        try {
                            const userDetails = await User.findById(
                                socket.userId, '_id fname mname lname grade email'
                            );
                            const io = serverStore.getSocketServerInstance();
                            io.to(data.id).emit('join', {
                                who: userDetails,
                                where: {
                                    _id: callDetails.id,
                                    summary: callDetails.summary,
                                    description: callDetails.description
                                }
                            });
                        } catch (error) {
                            console.log(error);
                            ErrorHandlers.msg(socket.id, 'Une erreur est survenue');
                        }
                    })
                    .catch(error => {
                        console.log(error);
                        return ErrorHandlers.msg(socket.id, 'Une erreur est survenue')
                    });
            })
            .catch(error => {
                console.log(error);
                return ErrorHandlers.msg(socket.id, 'Une erreur est surnvenue');
            });
    },
    leaveRoom: (socket, data) => {
        callSession.findOne({ _id: data.id, 'participants.identity': socket.userId })
            .then(async callDetails => {
                if (!callDetails) {
                    const io = serverStore.getSocketServerInstance();
                    return io.to(socket.id).emit('error', {
                        message: 'Appel introuvable'
                    });
                }
                for (const participant of callDetails.participants) {
                    if ((participant.identity === socket.userId) && !participant.state.isInRoom) {
                        const io = serverStore.getSocketServerInstance();
                        return io.to(socket.id).emit('error', {
                            message: 'L\'utilisateur ne figure pas dans l\'appel'
                        });
                    }
                }
                socket.leave(data.id);
                callDetails.participants.forEach(participant => {
                    if (participant.identity === socket.userId) {
                        participant.state.isInRoom = false;
                    }
                });
                callDetails.save()
                    .then(async () => {
                        try {
                            const userDetails = await User.findById(
                                socket.userId, '_id fname mname lname grade email'
                            );
                            const io = serverStore.getSocketServerInstance();
                            io.to(data.id).emit('leave', {
                                who: userDetails,
                                where: {
                                    _id: callDetails.id,
                                    summary: callDetails.summary,
                                    description: callDetails.description
                                }
                            });
                        } catch (error) {
                            console.log(error);
                            ErrorHandlers.msg(socket.id, 'Une erreur est survenue');
                        }
                    })
                    .catch(error => {
                        console.log(error);
                        return ErrorHandlers.msg(socket.id, 'Une erreur est survenue')
                    });
            })
            .catch(error => {
                console.log(error);
                return ErrorHandlers.msg(socket.id, 'Une erreur est survenue');
            });
    },
    signal: (socket, data) => {
        callSession.findOne({ _id: data.id, 'participants.identity': socket.userId })
            .then(async callDetails => {
                const io = serverStore.getSocketServerInstance();
                if(!callDetails){
                    return io.to(socket.id).emit('error', {
                        message: 'Appel introuvable'
                    });
                }
                switch(data.type){
                    case 'state':
                        callDetails.participants.forEach(member => {
                            if(member.identity === socket.userId){
                                member.state = {
                                    ...member.state,
                                    ...data.obj
                                }
                            }
                        });
                        break;
                    case 'auth':
                        callDetails.participants.forEach(member => {
                            if (member.identity === socket.userId) {
                                member.auth = {
                                    ...member.auth,
                                    ...data.obj
                                }
                            }
                        });
                        break;
                    default:
                        return io.to(socket.id).emit('error', {
                            message: '\'type\' incorrect'
                        });
                }
                const userDetails = await User.findById(socket.userId, '_id fname mname lname grade email');
                
                io.to(data.id).emit('signal', {
                    who: userDetails,
                    where: {
                        _id: callDetails.id,
                        summary: callDetails.summary,
                        description: callDetails.description
                    },
                    what: {
                        [data.type]: {
                            ...data.obj
                        }
                    }
                });
            })
            .catch(err => {
                console.log(err);
                return ErrorHandlers.msg(socket.id, 'Une erreur est survenue')
            });
    },
    ringHandler: async (socket, data) => {
        const userDetails = await User.findById(socket.userId, '_id fname mname lname grade email imageUrl');
        const callDetails = await callSession.findById(data.id, '_id summary description location');
        if(!callDetails){
            const receiverList = serverStore.getActiveConnections(socket.userId);

            const io = serverStore.getSocketServerInstance();

            receiverList.forEach(socketId => {
                io.to(socketId).emit('error', {
                    message: 'Appel introuvable'
                });
            });
        }
        const location = data.type == 'direct' ? data.target : callDetails.location;
        delete callDetails.location;

        const io = serverStore.getSocketServerInstance();
        io.to(data.id).emit('ringing', {
            who: userDetails,
            where: {
                ...callDetails,
                location: location
            }
        });
    },
    busyHandler: async (socket, data) => {
        const userDetails = await User.findById(socket.userId, '_id fname mname lname grade email imageUrl');
        const callDetails = await callSession.findById(data.id, '_id summary description location');
        if (!callDetails) {
            const receiverList = serverStore.getActiveConnections(socket.userId);

            const io = serverStore.getSocketServerInstance();

            receiverList.forEach(socketId => {
                io.to(socketId).emit('error', {
                    message: 'Appel introuvable'
                });
            });
        }
        const location = data.type == 'direct' ? data.target : callDetails.location;
        delete callDetails.location;

        const io = serverStore.getSocketServerInstance();
        io.to(data.id).emit('busy', {
            who: userDetails,
            where: {
                ...callDetails,
                location: location
            }
        });
    },
    hangUpHandler: async (socket, data) => {
        callSession.findOne({ _id: data.id, 'participants.identity': socket.userId })
            .then(async callDetails => {
                if (!callDetails) {
                    const io = serverStore.getSocketServerInstance();
                    return io.to(socket.id).emit('error', {
                        message: 'Appel introuvable'
                    });
                }
                const userDetails = await User.findById(
                        socket.userId, '_id fname mname lname grade email'
                    );
                for (const participant of callDetails.participants) {
                    if ((participant.identity == socket.userId) && !participant.state.isInRoom) {
                        const io = serverStore.getSocketServerInstance();
                        return io.to(data.id).emit('hang-up', {
                            who: userDetails,
                            where: {
                                _id: callDetails._id,
                                summary: callDetails.summary,
                                description: callDetails.description,
                                location: data.type == 'direct' ? data.target : callDetails.location
                            }
                        });
                    }
                }
                socket.leave(data.id);
                callDetails.participants.forEach(participant => {
                    if (participant.identity == socket.userId) {
                        participant.state.isInRoom = false;
                    }
                });
                callDetails.save()
                    .then(async () => {
                        try {
                            const userDetails = await User.findById(
                                socket.userId, '_id fname mname lname grade email'
                            );
                            const io = serverStore.getSocketServerInstance();
                            const rooms = io.sockets.adapter.rooms;

                            const receiverList = rooms.has(data.id) ? [data.id] : serverStore.getActiveConnections(
                                data.target
                                );

                            receiverList.forEach(socket => {
                                io.to(socket).emit('hang-up', {
                                    who: userDetails,
                                    where: {
                                        _id: callDetails._id,
                                        summary: callDetails.summary,
                                        description: callDetails.description,
                                        location: data.type == 'direct' ? data.target : callDetails.location
                                    }
                                });
                            });
                        } catch (error) {
                            console.log(error);
                            ErrorHandlers.msg(socket.id, 'Une erreur est survenue');
                        }

                        let toDelete = true;

                        for(let i = 0; i < callDetails.participants.length; i++){
                            if (callDetails.participants[i].isInRoom){
                                toDelete = false;
                                break;
                            }
                        }
                        // if(toDelete){
                        //     callSession.deleteOne({ _id: data.id })
                        //         .catch(error => {
                        //             console.log(error);
                        //             return ErrorHandlers.msg(socket.id, 'Une erreur est survenue');
                        //         });
                        // }
                    })
                    .catch(error => {
                        console.log(error);
                        return ErrorHandlers.msg(socket.id, 'Une erreur est survenue')
                    });
            })
            .catch(error => {
                console.log(error);
                return ErrorHandlers.msg(socket.id, 'Une erreur est survenue');
            });
    },
    disconnectHandler: async (socket, data) => {
        const userId = socket.userId;
        User.updateOne({ _id: userId }, { $set: { connected_at: Date.now() } })
            .then(async () => {
                const receiverList = [];
                const userDetails = await User.findOne({ _id: userId }, { connected_at: 1, contacts: 1 });
                userDetails.contacts.forEach(contact => {
                    receiverList.push(...serverStore.getActiveConnections(contact));
                });
                const io = serverStore.getSocketServerInstance();
                receiverList.forEach(socketId => {
                    io.to(socketId).emit('status', {
                        who: userId,
                        status: userDetails.connected_at
                    });
                });
            })
            .catch(error => {
                console.log(error);
                ErrorHandlers.msg(socket.id, 'Une erreur est survenue.');
            })
        callSession.find({ 'participants.identity': userId })
            .then(callSessions => {
                callSessions.forEach(async callSession => {
                    callSession.participants.forEach(participant => {
                        if(participant.identity == userId && participant.state.isInRoom){
                            participant.state.isInRoom = false;
                        }
                    });
                    // await callSession.save();
                });
                /*callSessions.save()
                    .then(() => {*/
                        callSessions.forEach(call => {
                            let toDelete = true;
                            for (let i = 0; i < call.participants.length; i++) {
                                if (call.participants[i].isInRoom) {
                                    toDelete = false;
                                    break;
                                }
                            }
                            if (toDelete) {
                                callSession.deleteOne({ _id: call._id })
                                    .catch(error => {
                                        console.log(error);
                                        return ErrorHandlers.msg(socket.id, 'Une erreur est survenue');
                                    });
                            }
                        });
                    /*})
                    .catch(error => {
                        console.log(error);
                        ErrorHandlers.msg(socket.id, 'Une erreur est survenue');
                    });*/
            })
            .catch(error => {
                console.log(error);
                ErrorHandlers.msg(socket.id, 'Une erreur est survenue');
            });

        serverStore.removeConnectedUser(socket.id);
    },
};
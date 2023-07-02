const User = require('../../../models/users/user.model');
const Chat = require('../../../models/chats/chat.model');
const callSession = require('../../../models/chats/callSession.model');
const socket = require('../../../handlers/socket');
const roomStore = require('../../../roomStore');
const Joi = require('joi');
const crypto = require('crypto');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const APP_ID = process.env.AGORA_APP_ID/*.slice(1, -2)*/;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

const callSessionSchema = Joi.object({
    _id: Joi.string()
        .min(9)
        .max(9)
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

const generateId = (char) => {
    const uid = crypto.randomUUID();
    const hash = crypto.createHash('sha1').update(uid).digest('hex');
    return hash.slice(0, char);
};

const getCallDetails = async (userId, data) => {
    const { type } = data;
    const { target } = data;
    const { tokenType } = data;
    const role = data.role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    let token;

    if (!target) {
        return {
            error: true,
            message: 'Le parametre \'target\' est requis'
        };
    }

    switch (type) {
        case 'direct':
            const userDetails = await User.findById(userId, 'contacts');
            //console.log(userDetails);
            if (!userDetails.contacts.includes(target)) {
                return {
                    error: true,
                    message: 'La cible ne figure pas dans la liste des contacts de l\'utilisateur'
                };
            }
            break;
        case 'room':
            const RoomExists = await Chat.exists({ _id: target, "members._id": userId });
            if (!RoomExists) {
                return {
                    error: true,
                    message: 'Groupe introuvable'
                };
            }
            break;
        default:
            return {
                error: true,
                message: 'Le parametre \'type\' est incorrect'
            };
    }

    const expireTime = 3600;
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireTime;

    switch (tokenType) {
        case 'uid':
            token = RtcTokenBuilder.buildTokenWithUid(
                APP_ID, APP_CERTIFICATE, target, 0, role, privilegeExpireTime
            );
            break;
        case 'userAccount':
            token = RtcTokenBuilder.buildTokenWithAccount(
                APP_ID, APP_CERTIFICATE, target, 0, role, privilegeExpireTime
            );
            break;
        default:
            return 'Le parametre \'tokenType\' est incorrect';
    }

    return {
        TOKEN: token,
        APP_ID: APP_ID,
        APP_CERTIFICATE: APP_CERTIFICATE,
        UID: 0,
        EXPIRE_AT: privilegeExpireTime
    };
};

module.exports = async (req, res, next) => {
    const userId = res.locals.userId;
    const data = req.body;

    const userDetails = await User.findById(userId, '_id fname mname lname grade email imageUrl contacts');
    let roomId;
    let roomDetails;
    let query;

    switch(data.type){
        case 'direct':

            if (!userDetails.contacts.includes(data.target)) {
                return res.status(400).json({ message: 'Cet utilisateur ne fait pas partie de vos contacts.' });
            }
            delete userDetails.contacts;

            query = { "members._id": { $all: [data.target, userId] }, 'type': 'direct' };
            break;

        case 'room':
            query = { _id: data.target };
            break;

        default:
            return res.status(400).json({ message: 'Le parametre \'type\' est incorrect' });
    }

    try {
        roomDetails = await Chat.findOne(
            query, { name: 1, description: 1, 'members._id': 1 }
        ).populate({
            path: 'members._id',
            model: User,
            select: '_id fname lname mname email grade imageUrl'
        }).exec();

        if (!roomDetails) {
            return res.status(404).json({ message: 'Discussion introuvable.' });
        }

        do {
            roomId = generateId(9);
        } while (await callSession.exists({ _id: roomId }));
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Une erreur est survenue' });
    }

    const callDetails = await getCallDetails(userId, data);
    if(callDetails.error){
        return res.status(400).json({ message: callDetails.message });
    }

    const state = data.state ? data.state : {};
    const { error, value } = callSessionSchema.validate({
        _id: roomId,
        start: Number(data.start) || Date.now(),
        duration: {
            seconds: 0
        },
        summary: data.summary,
        description: data.description,
        location: data.type === 'room' ? roomDetails._id.toString() : data.target,
        participants: roomDetails.members.map(participant => {
            return {
                identity: participant._id._id.toString(),
                state: {
                    isOrganizer: participant._id._id == userId ? true : false,
                    handRaised: false,
                    screenShared: false,
                    isMicActive: participant._id._id == userId ? Boolean(state.isMicActive) : undefined,
                    isCamActive: participant._id._id == userId ? Boolean(state.isCamActive) : undefined,
                    isInRoom: participant._id._id == userId ? true : false
                },
                auth: {
                    shareScreen: participant._id._id == userId ? true : false
                }
            }
        }),
        callDetails: {
            ...callDetails,
            ...data.details
        }
    });
    if (error) {
        console.log(error.details);
        return res.status(400).json({ message: error.details });
    }

    const isCallExists = await callSession.exists({ location: value.location, 'participants.identity': userId });

    // if(isCallExists){
    //     return res.status(409).json({ message: 'Appel en cours' });
    // }

    const callSessionObject = new callSession({
        ...value
    });

    callSessionObject.save()
        .then(async () => {
            const io = roomStore.getSocketServerInstance();
            const receiverList = [];
            callSessionObject.participants.forEach(member => {
                if(member.identity !== userId){
                    receiverList.push(roomStore.getActiveConnections(member.identity));
                }
            });
            if (receiverList.length == 0 && data.type == 'direct'){
                const socketId = roomStore.getActiveConnections(userId);
                const io = roomStore.getSocketServerInstance();
                socketId.forEach(socketId => {
                    io.to(socketId).emit('disconnect', {
                        where: {
                            _id: roomId,
                            // chat: data.target,
                            summary: callSessionObject.summary,
                            description: callSessionObject.description,
                            location: data.type === 'direct' ? data.target : callSessionObject.location
                        }
                    });
                });
            }
            receiverList.forEach(socketId => {
                io.to(socketId).emit('call', {
                    who: userDetails,
                    where: {
                        _id: roomId,
                        // chat: data.target,
                        summary: callSessionObject.summary,
                        description: callSessionObject.description,
                        location: data.type === 'direct' ? data.target : callSessionObject.location,
                        type: data.type
                    }
                });
            });

            const result = {
                ...callSessionObject._doc
            };

            for(let i = 0; i < result.participants.length; i++){
                // let participant = result.participants[i];
                for (let j = 0; j < roomDetails.members.length; j++){
                    let member = roomDetails.members[j]._id;
                    if (member._id == result.participants[i].identity) {
                        result.participants[i].identity = member;
                        // console.log(result.participants[i].identity);
                    }
                }
            }

            // result.participants.forEach(function(participant){
            //     roomDetails.members.forEach(function(member){
            //         if(member._id._id == participant.identity){
            //             participant.identity = {
            //                 ...member._id
            //             };
            //         }
            //     });
            // });
            const socket = roomStore.getUserSocketInstance(userId).socket;

            socket.join(roomId);
            io.to(roomId).emit('join', {
                who: userDetails,
                where: {
                    _id: roomId,
                    summary: callSessionObject.summary,
                    description: callSessionObject.description,
                    location: data.type === 'direct' ? data.target : callSessionObject.location
                }
            });

            res.status(201).json({ result });
            // socket.join(roomId);
            // try {
            //     const userDetails = await User.findById(userId, '_id fname mname lname grade email');
            //     const io = serverStore.getSocketServerInstance();
            //     io.to(roomId).emit('new-connexion', {
            //         who: userDetails,
            //         where: {
            //             _id: roomId,
            //             summary: callSessionObject.summary,
            //             description: callSessionObject.description,
            //             location: callSessionObject.location
            //         }
            //     });
            // } catch (error) {
            //     console.log(error);
            //     ErrorHandlers.msg(socket.id, 'Une erreur est survenue');
            // }
        })
        .catch(err => {
            console.log(err);
            return res.status(500).json({ message: 'Une erreur est survenue' });
        });
};
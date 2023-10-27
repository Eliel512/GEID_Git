const User = require('../../../models/users/user.model');
const Chat = require('../../../models/chats/chat.model');
const callSession = require('../../../models/chats/callSession.model');
const socket = require('../../../handlers/socket');
const roomStore = require('../../../serverStore');
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

const generateUid = participants => {

    function getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    const randomNumbers = [];
    participants.forEach(() => {
        let randomNumber;
        do{
            randomNumber = getRandomNumber(1, 10000);
        }while(randomNumbers.includes(randomNumber));
        randomNumbers.push(randomNumber);
    });

    return randomNumbers;

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

    let userDetails = await User.findById(userId, '_id fname mname lname grade email imageUrl contacts');
    userDetails = {
        ...userDetails._doc
    };
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
            query, { messages: 0, __v: 0 }
        ).populate({
            path: 'members._id',
            model: User,
            select: '_id fname lname mname email grade imageUrl'
        }).exec();

        if (!roomDetails && data.type == 'room') {
            return res.status(404).json({ message: 'Discussion introuvable.' });
        }else if(!roomDetails){
            try{
                const newRoom = new Chat({
                    type: 'direct',
                    members: [{
                        _id: userId,
                        role: 'simple'
                    }, {
                        _id: data.target,
                        role: 'simple'
                    }]
                });
                await newRoom.save();
                
                roomDetails = await Chat.findOne(
                    { _id: newRoom._id }, { name: 1, description: 1, 'members._id': 1 }
                ).populate({
                    path: 'members._id',
                    model: User,
                    select: '_id fname lname mname email grade imageUrl'
                }).exec();

            }catch(error){
                console.log(error);
                return res.status(500).json({ message: 'Une erreur est survenue.' })
            }
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
    let { error, value } = callSessionSchema.validate({
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

    const randomNumbers = generateUid(value.participants);

    for(let i = 0; i < value.participants.length; i++){
        value.participants[i].uid = randomNumbers[i];
    }

    value.status = 0;

    if(data.type == 'room'){
        value.room = {
            ...roomDetails
        };
        value.status = 1;
    }

    const callSessionObject = new callSession({
        ...value
    });

    callSessionObject.save()
        .then(async () => {

            const result = {
                ...callSessionObject._doc
            };

            for (let i = 0; i < result.participants.length; i++) {
                // let participant = result.participants[i];
                for (let j = 0; j < roomDetails.members.length; j++) {
                    let member = roomDetails.members[j]._id;
                    if (member._id == result.participants[i].identity) {
                        result.participants[i].identity = member;
                        // console.log(result.participants[i].identity);
                    }
                }
            }
            // if(data.type == 'room'){
            //     result.location = {
            //         ...roomDetails
            //     }
            // }


            const socket = roomStore.getUserSocketInstance(userId).socket;
            const io = roomStore.getSocketServerInstance();
            const receiverList = [];

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

            callSessionObject.participants.forEach(member => {
                if(member.identity._id != userId){
                    receiverList.push(...roomStore.getActiveConnections(member.identity._id));
                }
            });

            if (receiverList.length == 0 && data.type == 'direct'){
                const socketId = roomStore.getActiveConnections(userId);
                const io = roomStore.getSocketServerInstance();
                socketId.forEach(socketId => {
                    io.to(socketId).emit('disconnected', {
                        where: {
                            _id: roomId,
                            // chat: data.target,
                            summary: callSessionObject.summary,
                            description: callSessionObject.description,
                            location: data.type === 'direct' ? data.target : callSessionObject.location
                        }
                    });
                });
            }else {
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
            }

            res.status(201).json(result);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};
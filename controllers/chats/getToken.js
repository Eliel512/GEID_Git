const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const mongoose = require('mongoose');
const User = require('../../models/users/user.model');
const Chat = require('../../models/chats/chat.model');
const updateHandlers = require('../../handlers/updates');
const APP_ID = process.env.AGORA_APP_ID/*.slice(1, -2)*/;
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

module.exports = async (req, res) => {
    const { type } = req.params;
    const { userId } = res.locals;
    const { target } = req.params;
    const { tokenType } = req.params;
    const role = req.params.role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    let token;

    if (!target) {
        return res.status(400).json({ message: 'Le parametre \'target\' est requis' });
    }

    switch(type){
        case 'direct':
            const userDetails = await User.findById(userId, 'contacts');
            //console.log(userDetails);
            if(!userDetails.contacts.includes(target)){
                return res.status(404).json({
                    message: 'La cible ne figure pas dans la liste des contacts de l\'utilisateur'
                });
            }
            break;
        case 'room':
            const RoomExists = await Chat.exists({ _id: target, "members._id": userId });
            if(!RoomExists){
                return res.status(404).json({ message: 'Groupe introuvable' });
            }
            break;
        default:
            return res.status(400).json({ message: 'Le parametre \'type\' est incorrect' });
    }

    const expireTime = 3600;
    const currentTime = Math.floor(Date.now() / 1000);
    const privilegeExpireTime = currentTime + expireTime;

    switch(tokenType){
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
            return res.status(400).json({ message: 'Le parametre \'tokenType\' est incorrect' });
    }

    //updateHandlers.updateIncomingCalls(userId, target, type);
    //console.log(APP_ID);
    res.status(200).send({
        TOKEN: token,
        APP_ID: APP_ID,
        APP_CERTIFICATE: APP_CERTIFICATE,
        UID: 0,
        EXPIRE_AT: privilegeExpireTime
    });
};
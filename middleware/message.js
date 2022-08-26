const User = require('../models/user');
const { Space } = require('../models/space');
const Channel = require('../models/channel');

const isChannelMember = async (member, channelId) => {
    const channel = await Channel.findOne({ _id: channelId });
    return channel.members.includes(member);
};

const isSpaceMember = async (member, spaceId) => {
    const space = await Space.findOne({ _id: spaceId });
    return space.members.includes(member);  
};

const isSpaceChannel = async (channelId, spaceId) => {
    const space = await Space.findOne({ _id: spaceId });
    return space.channels.includes(channel);
};

module.exports = {
    sendMessage: async (req, res, next) => {
        const { content, to } = req.body;
        switch(to.type){
            case 'user':
                try {
                    await User.findOne({ _id: to.coordinates });
                    res.locals.message = {
                        sender: res.locals.userId,
                        content: content,
                        recipient: to
                    };
                }catch {
                    res.status(400).json({ message: 'Coordonnées spécifiées incorrectes.' })
                }
                break;
            case 'space':
                try {
                    const spaceId = await Space.findOne({ name: to.coordinates.space })._id;
                    const channelId = await Channel.findOne({ name: to.coordinates.channel })._id;
                    switch(isSpaceMember(res.locals.userId, spaceId)){
                        case true:
                        case isSpaceChannel(channelId, spaceId) === true:
                        case isChannelMember(res.locals.userId, channelId) === true:
                            res.locals.message = {
                                sender: res.locals.userId,
                                content: content,
                                recipient: to
                            };
                            break;
                    }
                }catch {
                    res.status(400).json({ message: 'Coordonnées spécifiées incorrectes' });
                }
                break;
            default:
                res.status(400).json({ message: 'Le destinataire est soit \'user\' soit \'space\'.' })
        }
        next();
    }
};
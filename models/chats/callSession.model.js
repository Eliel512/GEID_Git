const mongoose = require('mongoose'), { Schema } = require('mongoose');
const isValidObjectId = require('../../tools/isValidObjectId');

const callSessionSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: false
    },
    startedAt: {
        type: String,
        required: true
    },
    endedAt: {
        type: String,
        required: false
    },
    duration: {
        hours: {
            type: Number,
            required: false
        },
        minutes: {
            type: Number,
            required: false
        },
        seconds: {
            type: Number,
            required: true
        }
    },
    summary: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: false
    },
    createdBy: {
        type: String,
        ref: 'users',
        validator: {
            validate: value => isValidObjectId(value),
            message: 'La cle \'createdBy\' doit correspondre a un _id de user valide'
        },
        required: true
    },
    location: {
        type: String,
        ref: 'chats',
        validator: {
            validate: value => isValidObjectId(value),
            message: 'La cle \'location\' doit correspondre a un _id de chat valide'
        },
        required: true
    },
    room: {
        type: Schema.Types.Mixed,
        required: false
    },
    status: {
        type: Number,
        required: true
    },
    participants: {
        type: [{
            identity: {
                type: String,
                refPath: 'participants.itemModel',
                // validator: {
                //     validate: value => isValidObjectId(value),
                //     message: 'La cle \'participants.identity\' doit correspondre a un _id de user valide'
                // },
                required: true
            },
            itemModel: {
                type: String,
                enum: ['users', 'guests'],
                required: true
            },
            uid: {
                type: Number,
                required: true
            },
            state: {
                isOrganizer: {
                    type: Boolean,
                    required: false
                },
                handRaised: {
                    type: Boolean,
                    required: true
                },
                screenShared: {
                    type: Boolean,
                    required: true
                },
                isCamActive: {
                    type: Boolean,
                    required: false
                },
                isMicActive: {
                    type: Boolean,
                    required: false
                },
                isInRoom: {
                    type: Boolean,
                    required: true
                },
            },
            auth: {
                shareScreen: {
                    type: Boolean,
                    required: true
                }
            }
        }],
        required: true
    },
    guests: {
        type: {
            identity: {
                type: String,
                refPath: 'guests.itemModel',
                // validator: {
                //     validate: value => isValidObjectId(value),
                //     message: 'La cle \'guests.identity\' doit correspondre a un _id de user valide'
                // },
                required: true
            },
            itemModel: {
                type: String,
                enum: ['users', 'guests'],
                required: true
            }
        },
        default: []
    },
    messages: [{
        content: {
            type: String,
            required: true
        },
        sender: {
            type: Schema.Types.Mixed,
            required: true
        },
        createdAt: {
            type: Date,
            required: true
        },
        clientId: {
            type: String,
            required: false
        },
        ref: {
            type: String,
            required: false
        }
    }],
    callDetails: {
        type: Schema.Types.Mixed,
        required: true
    }
}, { timestamps: true, _id: false });

callSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 1000 * 24 });

const CallSession = mongoose.model('callSession', callSessionSchema);

module.exports = CallSession;
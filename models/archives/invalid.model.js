const mongoose = require('mongoose'),
    { Schema } = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { isValidObjectId } = require('../../tools/isValidObjectId');

const invalidSchema = new Schema({    
    type: {
        type: {
            type: String,
            required: [true, "Le champ 'type.type' est requis"]
        },
        subtype: {
            type: String,
            required: false
        }
    },
    designation: {
        type: String,
        required: [true, "Le champ 'designation' est requis"]        
    },
    description: {
        type: String,
        required: [true, "Le champ 'description' est requis"],
    },
    administrativeUnit: {
        type: String,
        ref: 'role',
        validate: {
            validator: role => isValidObjectId(role),
            message: () => "Au champ 'administrativeUnit' doit correspondre un _id de role valide"
        },
        required: [true, "Le champ 'administrativeUnit' est requis"]
    },
    event: {
        type: String,
        ref: 'event',
        validate: {
            validator: event => isValidObjectId(event),
            message: () => "Au champ 'event' doit correspondre un _id de event valide"
        },
        required: false
    },    
    notes: {
        type: String,
        required: false,
    },
    management: {
        type: [String],
        ref: 'users',
        validate: {
            validator: user => isValidObjectId(user),
            message: () => "Au champ 'management' doivent correspondre des _id de user valides"
        },
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    }    
}, { timestamps: true });


invalidSchema.index({ createdAt: 1 }, { expireAfterSeconds: 604800, name: 'createt_At' });

const Invalid = mongoose.model('invalids', invalidSchema);

module.exports = Invalid;
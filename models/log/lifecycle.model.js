const mongoose = require('mongoose'),
    { Schema } = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { isValidObjectId } = require('../../tools/isValidObjectId');

const lifecycleSchema = new Schema({
    doc: {
        type: String,
        ref: 'doc',
        validate: {
            validator: doc => isValidObjectId(doc),
            message: () => "Au champ 'doc' doit correspondre un _id de doc valide"
        },
        required: true
    },
    format: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    profil: {
        type: String,
        required: true
    },
    status: {
        type: Number,
        required: true
    }
}, { timestamps: true });

// lifecycleSchema.plugin(uniqueValidator);

const LifeLog = mongoose.model('lifecycle', lifecycleSchema);

module.exports = LifeLog;
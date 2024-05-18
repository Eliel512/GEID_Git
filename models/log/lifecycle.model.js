const mongoose = require('mongoose'),
    { Schema } = require('mongoose');
// const uniqueValidator = require('mongoose-unique-validator');
const isValidObjectId = require('../../tools/isValidObjectId');

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
        ref: 'profil',
        validate: {
            validator: value => isValidObjectId(value),
            message: () => "Au champ 'profil' doit correspondre un _id de profil valide"
        },
        required: [true, "Le champ 'profil' est requis"]
    },
    status: {
        type: Number,
        required: true,
        default: 'active'
    }
}, { timestamps: true });

// lifecycleSchema.plugin(uniqueValidator);

const LifeLog = mongoose.model('lifecycle', lifecycleSchema);

module.exports = LifeLog;
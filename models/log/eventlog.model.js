const mongoose = require('mongoose'),
    { Schema } = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { isValidObjectId } = require('../../tools/isValidObjectId');

const eventlogSchema = new Schema({
    doc: {
        type: String,
        ref: 'doc',
        validate: {
            validator: doc => isValidObjectId(doc),
            message: () => "Au champ 'doc' doit correspondre un _id de doc valide"
        },
        required: true
    },
    createdBy: {
        type: String,
        required: true
    },
    event: {
        type: String,
        required: true
    },
    result: {
        type: String,
        required: true
    }
}, { timestamps: true });

// eventlogSchema.plugin(uniqueValidator);

const EventLog = mongoose.model('eventlog', eventlogSchema);

module.exports = EventLog;
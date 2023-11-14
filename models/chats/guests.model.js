const mongoose = require('mongoose'), { Schema } = require('mongoose');
// const isValidObjectId = require('../../tools/isValidObjectId');

const guestsSchema = new Schema({
    _id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    }
}, { timestamps: true });

// guestsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 1000 * 24 });

const Guest = mongoose.model('guests', guestsSchema);

module.exports = Guest;
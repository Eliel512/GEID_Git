const { isArray } = require('lodash');
const mongoose = require('mongoose'), { Schema } = require('mongoose');
const { memberSchema } = require('./space');

const channelSchema = new Schema({
  createdAt: {
    type: Date,
    required: true,
    default: new Date()
  },
  name: {
    type: String,
    require: true
  },
  description: {
    type: String,
    required: true,
    minlength: [5, 'La description doit contenir un minimum de 5 caractères.']
  },
  members: {
    type: [memberSchema],
    validate: {
        validator: value => Boolean(isArray(value) && value.length > 0),
        message: 'Un canal doit contenir au moins un membre'
    },
    required: true
  }
});

const channelDB = mongoose.connection.useDb('UserInfo');

const Channel = channelDB.model('channels', channelSchema);

module.exports = Channel;
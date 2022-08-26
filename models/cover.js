const mongoose = require('mongoose'), { Schema } = require('mongoose');
const uniqueValidator= require('mongoose-unique-validator');

const coverSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  docTypes: {
      type: Array,
      required: false
  },
  contentUrl: {
      type: String,
      unique: true,
      required: true
  }
});

coverSchema.plugin(uniqueValidator);
const coverDB = mongoose.connection.useDb('archives');
const Cover = coverDB.model('covers', coverSchema);

module.exports = Cover;

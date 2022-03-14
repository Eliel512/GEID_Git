const mongoose = require('mongoose'), { Schema } = require('mongoose');
const uniqueValidator= require('mongoose-unique-validator');

const roleSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  childs: {
    type: Array,
    required: false
  },
  parent: {
      type: String,
      required: false,
  },
  docTypes: {
      type: Array,
      required: false
  }
});

roleSchema.plugin(uniqueValidator);

const roleDB = mongoose.connection.useDb('UserInfo');

const Role = roleDB.model('roles', roleSchema);

module.exports = Role;
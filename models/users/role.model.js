// @ts-check
/// <reference path="../../types/user.type.js" />
const mongoose = require("mongoose"),
  { Schema } = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");
const isValidObjectId = require("../../tools/isValidObjectId");

const roleSchema = new Schema({
  name: {
    type: String,
    required: [true, "Le champ 'name' est requis."],
    unique: true,
  },
  children: {
    type: [String],
    required: false,
  },
  parent: {
    type: String,
    required: false,
  },
  docTypes: {
    type: Array,
    required: false,
  },
  management: {
    type: [String],
    ref: "users",
    validate: {
      validator: (user) => isValidObjectId(user),
      message: () =>
        "Au champ 'management' doivent correspondre des _id de user valides",
    },
    required: false,
  },
});

roleSchema.plugin(uniqueValidator);

/** @type {import("mongoose").Model<Role>} */
const Role = mongoose.model("roles", roleSchema);

module.exports = Role;

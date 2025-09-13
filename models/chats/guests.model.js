// @ts-check
/// <reference path="../../types/guest.type.js" />

const mongoose = require("mongoose"),
  { Schema } = require("mongoose");
// const isValidObjectId = require('../../tools/isValidObjectId');

const guestsSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: false,
    },
  },
  { timestamps: true, _id: false }
);

// guestsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 1000 * 24 });

/** @type {import('mongoose').Model<GuestUser>} */
const Guest = mongoose.model("guests", guestsSchema);

module.exports = Guest;

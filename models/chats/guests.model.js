// @ts-check
/// <reference path="../../types/guest.type.js" />

const mongoose = require("mongoose"),
  { Schema } = require("mongoose");
// const isValidObjectId = require('../../tools/isValidObjectId');

const guestsSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

// guestsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 1000 * 24 });
guestsSchema.pre("save", function (next) {
  if (this._id && typeof this._id === "string") {
    this._id = mongoose.Types.ObjectId(this._id);
  }
  next();
});
// guestsSchema.pre("save", function (next) {
//   if (this._id && typeof this._id === "string") {
//     this._id = Types.ObjectId(this._id);
//   }
//   next();
// });

/** @type {import('mongoose').Model<GuestUser>} */
const Guest = mongoose.model("guests", guestsSchema);

module.exports = Guest;

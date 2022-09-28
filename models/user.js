const mongoose = require('mongoose'), { Schema } = require('mongoose');
const uniqueValidator= require('mongoose-unique-validator');
const validator = require('validator');
const { isValidObjectId } = require('../tools/validators');

const userInfoSchema = new Schema({
  joinedAt: {
    type: Date,
    required: true,
    default: new Date(),
  },
  isValid: {
    type: Boolean,
    required: true,
    default: false
  },
  fname: {
      type: String,
      required: true
  },
  mname: {
    type: String,
    required: false
  },
  lname: {
    type: String,
    required: true
  },
  email: {
      type: String,
      trim: true,
      lowercase: true,
      required: 'L\'adresse email est requise',
      validate: {
        validator: v => validator.isEmail(v),
        message: 'Email invalide'
      },
      set: v => validator.normalizeEmail(v),
      unique: true
  },
  password: {
    type: String,
    required: true
  },
  phoneCell: {
    type: String,
    required: true,
    validate: {
      validator: v => validator.isMobilePhone(v),
      message: 'Email invalide'
    },
    unique: true
  },
  grade: {
    grade: {type: String, required: true},
    role: {type: String, required: true, unique: true},
    permission: {
      type: [String],
      validate: {
        validator: values => {
          const permissions = ['archives', 'bibliotheque', 'phototheque', 'filmotheque', 'workspace', 'admin'];
          return values.filter(value => {
            return permissions.find(el => el === value) ? true : false;
          }).length > 0;
        },
        message: 'Incorrect permission'
      },
      default: ['workspace'],
      required: true
    }
  },
  contacts: {
    type: [String],
    required: true,
    ref: 'userInfo',
    validate: {
      validator: values => values.every(isValidObjectId),
      message: () => 'Une référence de contact doit correspondre à un id d\'utilisateur valide.'
    }
  },
  imageUrl: {
    type: String,
    required: false,
  }

});

userInfoSchema.plugin(uniqueValidator);

const userDB = mongoose.connection.useDb('UserInfo');

const UserInfo = userDB.model('userInfo', userInfoSchema);

module.exports = UserInfo;
const mongoose = require('mongoose'), { Schema } = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const validator = require('validator');
const isValidObjectId = require('../../tools/isValidObjectId');

const userSchema = new Schema({
  isValid: {
    type: Boolean,
    required: [true, 'Le champ \'isValid\' est requis.'],
    default: false
  },
  fname: {
    type: String,
    required: [true, 'Le champ \'fname\' est requis.']
  },
  mname: {
    type: String,
    required: false
  },
  lname: {
    type: String,
    required: [true, 'Le champ \'lname\' est requis.']
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    required: [true, 'L\'adresse email est requise'],
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
    grade: {
      type: String,
      required: [true, 'Le champ \'grade.grade\' est requis.']
    },
    role: {
      type: String,
      required: [true, 'Le champ \'grade.role\' est requis.'],
      unique: true
    }    
  },
  auth: {
    readOnly: {
      type: [String],
      enum: ['archives'],
      required: false,
      set: value => [ ...new Set(value)]      
    },
    readNWrite: {
      type: [String],
      enum: ['archives', 'books', 'images', 'films', 'work', 'admin'],
      required: true,      
      default: ['work'],
      set: value => [ ...new Set(value)]
    }
  },
  contacts: {
    type: [String],
    required: false,
    ref: 'users',
    validate: {
      validator: values => values.every(isValidObjectId),
      message: () => 'Une référence de contact doit correspondre à un id d\'utilisateur valide.'
    }
  },
  imageUrl: {
    type: String,
    required: false,
  }
}, { timestamps: { createdAt: 'joinedAt' } });

userSchema.plugin(uniqueValidator);

const User = mongoose.model('users', userSchema);

module.exports = User;
const mongoose = require('mongoose'), { Schema } = require('mongoose');
const isValidObjectId = require('../../tools/isValidObjectId');

const invitationSchema = new Schema({  
  from: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'userInfo',
    validate: {
        validator: value => isValidObjectId(value),
        message: () => 'La clé \'from\' doit correspondre à un id d\'utilisateur valide.'
    }
  },
  to: {
    type: String,
    required: true,
    ref: 'userInfo',
    validate: {
        validator: value => isValidObjectId(value),
        message: () => 'La clé \'to\' doit correspondre à un id d\'utilisateur valide.'
    }
  },
  for: {
    type: String,
    required: true,
    enum: {
        values: ['connexion', 'salon'],
        message: 'La clé \'object\' doit correspondre soit à \'connection\' soit à \'room\'.'
    }
  },
  details: {
    type: String,
    required: false,
    minlength: ['5', 'Les détails d\'une invitation doivent contenir un minimum de 5 caractères.']
  }
}, { timestamps: true });

const Invitation = mongoose.model('invitations', invitationSchema);

module.exports = Invitation;
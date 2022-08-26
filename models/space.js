const { isArray } = require('lodash');
const mongoose = require('mongoose'), { Schema } = require('mongoose');

const isValidObjectId = value => {
    let valueId;
    try {
        valueId = new mongoose.Types.ObjectId(value);
    }catch {
        valueId = false;
    }
    return value === valueId;
};

const memberSchema = new Schema({
    _id: {
        type: String,
        validate: {
            validator: function(value){
                return isValidObjectId(value);
            },
            message: function(){
                return 'La clé \'_id\' d\'un membre doit correspondre à un id d\'utilisateur valide.';
            }
        },
        required: true
    },
    role: {
        type: String,
        enum: {
            values: ["admin", "simple"],
            message: 'Un utilisateur est soit \'admin\' soit \'simple\'.'
        },
        required: true
    }
});

const spaceSchema = new Schema({
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
        message: 'Un espace doit contenir au moins un membre'
    },
    required: true
  },
  channels: [{
    number: {
        type: Number,
        validate: {
            validator: value => Number.isInteger(value),
            message: 'Le numéro d\'un canal doit être un nombre entier.'
        },
        required: true
    },
    _id: {
        type: String,
        validate: {
            validator: function(value){
                return isValidObjectId(value);
            },
            message: 'La clé \'_id\' d\'un canal doit correspondre à un id valide.'
        },
        required: true
    }
  }]
});

const spaceDB = mongoose.connection.useDb('UserInfo');

const Space = spaceDB.model('spaces', spaceSchema);

module.exports = { Space, memberSchema };
const mongoose = require('mongoose'), { Schema } = require('mongoose');
const isValidObjectId = require('../../tools/isValidObjectId');

const memberSchema = new Schema({
    _id: {
        type: String,
        required: true,
        validate: {
            validator: function(value){
                return isValidObjectId(value);
            },
            message: function(){
                return 'La clé \'_id\' d\'un membre doit correspondre à un id d\'utilisateur valide.';
            }
        }
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

const channelSchema = new Schema({
    _id: {
      type: String,
      required: true,
      validate: {
          validator: function(value){
              return isValidObjectId(value);
          },
          message: 'La clé \'_id\' d\'un chat doit correspondre à un id valide.'
      }
    },    
    name: {
      type: String,
      require: true
    },
    description: {
      type: String,
      required: true,
      minlength: [5, 'La description doit contenir un minimum de 5 caractères.']
    }
}, { timestamps: true });

const spaceSchema = new Schema({  
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
    required: true,
    validate: {
        validator: value => value.length > 1,
        message: 'Un espace doit contenir au moins deux membre'
    }
  },
  chats: {
    type: [channelSchema],
    required: false
  }
}, { timestamps: true });

const Space = mongoose.model('spaces', spaceSchema);

module.exports = Space;
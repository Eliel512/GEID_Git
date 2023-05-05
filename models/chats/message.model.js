const mongoose = require('mongoose'), { Schema } = require('mongoose');
const isValidObjectId = require('../../tools/isValidObjectId');

const messageSchema = new Schema({
  createdAt: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    required:true,
    enum: {
      values: ['text', 'doc', 'media', 'event', 'voice', 'call'],
      message: 'La clé \'type\' est comprise dans la liste: \'text\', \'file\' \'event\', \'voice\', \'call\'.'
    }
  },
  subtype: {
    type: String,
    required: false,
    validate: {
      validator: function(value) {
        if(this.type === 'media'){
          const enums = ['AUDIO', 'VIDEO', 'IMAGE']
          if (!enums.includes(value.toUpperCase())) {
            return false;
          }
        }
        return true;
      },
      message: 'Sous-type invalide.'
    },
    set: value => value.toUpperCase()
  },
  content: {
    type: String,
    required: true
  },
  ref: {
    type: String,
    required: false,
    ref: 'message',
    validate: {
        validator: value => isValidObjectId(value),
        message: () => 'La clé \'ref\' doit correspondre à un id de message valide.'
    }
  },
  sender: {
    type: String,
    required: true,
    ref: 'userInfo',
    validate: {
        validator: value => isValidObjectId(value),
        message: function(){
            return 'La clé \'sender\' doit correspondre à un id d\'utilisateur valide';
        }
    }
  },
  clientId: {
    type: String,
    required: false
  },
  status: {
    type: mongoose.Mixed,
    required: false
  },
  details: {
    type: mongoose.Mixed,
    required: false
  }
}, { timestamps: true });

const Message = mongoose.model('messages', messageSchema);

module.exports = Message;
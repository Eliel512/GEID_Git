const mongoose = require('mongoose'), { Schema } = require('mongoose');
const { isValidObjectId } = require('../tools/validators');

const messageSchema = new Schema({
  createdAt: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    required:true,
    enum: {
      values: ['text', 'file'],
      message: 'La clé \'type\' est soit \'text\' soit \'file\'.'
    }
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
  }/*,
  receiver: {
    type: String,
    required: true,
    ref: 'userInfo',
    validate: {
        validator: value => isValidObjectId(value),
        message: function(){
            return 'La clé \'recipient\' doit correspondre à un id de chat valide.';
        }
    }
  }*/
});

const messageDB = mongoose.connection.useDb('UserInfo');

const Message = messageDB.model('message', messageSchema);

module.exports = Message;
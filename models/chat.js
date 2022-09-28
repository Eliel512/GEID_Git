const mongoose = require('mongoose'), { Schema } = require('mongoose');
const { isValidObjectId } = require('../tools/validators');

const chatSchema = new Schema({
  createdAt: {
    type: Date,
    required: false,
    default: Date.now()
  },
  createdBy: {
    type: String,
    required: false,
    ref: 'userInfo',
    validate: {
      validator: function(value){
        return isValidObjectId(value);
      },
      message: 'La clé \'createdBy\' doit correspondre à un id d\'utilisateur valide.'
    }
  },
  type: {
    type: String,
    enum: {
      values: ['direct', 'room'],
      message: 'Un chat est soit de type \'direct\' soit de type \'room\'.'
    },
    required: true
  },
  name: {
    type: String,
    required: false
  },
  description: {
    type: String,
    required: false
  },
  members: {
    type: [{
      _id: {
        type: String,
        required: true,
        ref: 'userInfo',
        validate: {
            validator: function(value){
              return isValidObjectId(value);
            },
            message: 'La clé \'_id\' doit correspondre à un id d\'utilisateur valide.'
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
    }],
    required: true,
    validate: {
      validator: function(values){
        switch(this.type){
          case 'direct':
            const length = values.length;
            return Boolean(
              length > 0 && length <= 2 
              && values.every(member => isValidObjectId(member._id)) 
              && values.every(member => member.role === 'simple')
              )
            break;
          case 'room':
            return Boolean(
              values.length > 1 && values.every(member => isValidObjectId(member._id)) && values.some(member => member.role === 'admin')
              )
            break;
        }
      },
      message: 'Un chat doit contenir au moins un membre et un salon doit contenir au moins deux membres.'
      }
  },
  messages: {
    type: [String],
    required: false,
    ref: 'message',
    validate: {
      validator: values => values.every(isValidObjectId),
      message: () => 'Une référence de message doit correspondre à un id de message valide.'
    }
  }
});

const chatDB = mongoose.connection.useDb('UserInfo');

const Chat = chatDB.model('chats', chatSchema);

module.exports = Chat;
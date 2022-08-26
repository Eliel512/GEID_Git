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
const isValidChannelCoordinates = value => {
    const { space, channel } = value;
    return isValidObjectId(space) && isValidObjectId(channel);
};

const messageSchema = new Schema({
  createdAt: {
    type: Date,
    required: true,
    default: new Date()
  },
  content: {
    type: String,
    required: true
  },
  sender: {
    type: mongoose.Types.ObjectId,
    required: true,
    validate: {
        validator: value => isValidObjectId(value)
    }
  },
  recipient: {
    type: {
        type: String,
        enum: ["user", "space"],
        required: true
    },
    coordinates: {
        type: mongoose.Mixed,
        required: true,
        validate: {
            validator: function(value){
                const type = this.recipient.type;
                if(type === 'user'){
                    return isValidObjectId(value);  
                }
                return isValidChannelCoordinates(value);
            },
            message: function(){
                return 'Les coordonées doivent correspndre à un id d\'utilisateur valide ou un objet ayant une clé \'space\' contenant l\'id de l\'espace et une clé \'channel\' contenant l\'id du channel';
            }
        }
    }
  }
});

const messageDB = mongoose.connection.useDb('UserInfo');

const Message = messageDB.model('messages', messageSchema);

module.exports = Message;
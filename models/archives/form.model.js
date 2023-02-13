const mongoose = require('mongoose'), { Schema } = require('mongoose');
const { isValidObjectId } = require('../../tools/isValidObjectId');
const uniqueValidator = require('mongoose-unique-validator');

const formSchema = new Schema({    
    transaction: {
        type: String,
        enum: ['add', 'up', 'del'],
        required: [true, "Le champ 'transaction' est requis"]
    },
    copiesUrl: {
        principal: {
            type: String,
            required: [true, "Le champ 'copiesUrl.principal' est requis"],
            unique: true
        },
        others: {
            type: [String],
            required: false
        }
    }
}, { discriminatorKey: 'kind' });

formSchema.plugin(uniqueValidator);

const Form = mongoose.model('forms', formSchema);

module.exports = Form;
const mongoose = require('mongoose'), { Schema } = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
// const isValidObjectId = require('../../tools/isValidObjectId');

const authSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    // Définir les privileges du rôle
    privileges: [{
        app: {
            type: String,
            required: true
        },
        permissions: [{
            // Définir le nom de la structure
            struct: {
                type: String,
                required: true,
            },
            // Définir le type d'accès (lecture ou écriture)
            access: {
                type: String,
                enum: ['read', 'write']
            }
        }]
    }],
    upper: {
        type: [String],
        required: false,
        default: ['admin']
    }
}, { timestamps: true });

authSchema.plugin(uniqueValidator);

const Auth = mongoose.model('auth', authSchema);

module.exports = Auth;
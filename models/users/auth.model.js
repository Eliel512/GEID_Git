const mongoose = require('mongoose'), { Schema } = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const isValidObjectId = require('../../tools/isValidObjectId');

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
                ref: 'roles',
                validate: {
                    validator: value => isValidObjectId(value),
                    message: () => 'Le champ \'permissions.struct\' doit correspondre à un id de role valide.'
                }
            },
            // Définir le type d'accès (lecture ou écriture)
            access: {
                type: String,
                enum: ['read', 'write']
            }
        }]
    }]
}, { timestamps: true });

authSchema.plugin(uniqueValidator);

const Auth = mongoose.model('auth', authSchema);

module.exports = Auth;
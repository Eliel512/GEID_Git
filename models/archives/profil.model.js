const mongoose = require('mongoose'), { Schema } = require('mongoose');
const { isValidObjectId } = require('../../tools/isValidObjectId');
const uniqueValidator = require('mongoose-unique-validator');
const { archiveSchemaProfil } = require('./archive.model');

const profilSchema = new Schema({
    name: {
	    type: String,
        unique: true,
	    required: [true, "Le champ 'name' est requis"]
    },
    roles: {
        type: [String],
        ref: 'role',
        validate: {
            validator: roles => roles.every(isValidObjectId),
            message: () => "Au champ 'roles' doivent correspondre des _id de role valides"
        },
        required: [true, "Le champ 'roles' est requis"]
    },
    privacy: {
        type: Number,
        min: [0, "Au champ 'privacy', le minimum est de '0'"],
        max: [3, "Au champ 'privacy', le maximum est de '3'"],
        required: [true, "Le champ 'privacy' est requis"]
    },
    retentionSchedule: {
        type: String,
        ref: 'retention',
        validate: {
            validator: value => isValidObjectId(value),
            message: () => "Au champ 'retentionSchedule' doit correspondre des _id de calendrier de conservation valides"
        },
        required: [true, "Le champ 'retentionSchedule' est requis"]
    }
}, { discriminatorKey: 'kind' });

profilSchema.plugin(uniqueValidator);

const Profil = mongoose.model('profils', profilSchema);
//const ArchiveProfil = Profil.discriminator('archiveProfil', archiveSchemaProfil);

module.exports = Profil;
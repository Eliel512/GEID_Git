const mongoose = require('mongoose'),
	{ Schema } = require('mongoose');
const uniqueValidator= require('mongoose-unique-validator');
const { isValidObjectId } = require('../../tools/isValidObjectId');

const archiveSchema = new Schema({
	version: {
		type: String,
		required: [true, "Le champ 'version' est requis"]
	},
	classNumber: {
		type: String,
		required: [true, "Le champ 'classNumber' est requis"],
		unique: true
	},
	refNumber: {
		type: String,
		required: [true, "Le champ 'refNumber' est requis"],
		unique: true
	},
	type: {
		type: {
			type: String,
			required: [true, "Le champ 'type.type' est requis"]
		},
		subtype: {
			type: String,
			required: false
		},
		profil: {
			type: String,
			ref: 'profil',
			validate: {
				validator: value => isValidObjectId(value),
				message: () => "Au champ 'type.profil' doit correspondre un _id de profil valide"
			},
			required: [true, "Le champ 'type.profil' est requis"]
		}
	},
	designation: {
		type: String,
		required: [true, "Le champ 'designation' est requis"], 
		unique: true
	},
	description: {
		type: String,
		required: [true, "Le champ 'description' est requis"],
	},
	administrativeUnit: {
		type: String, 
		ref: 'role',
		validate: {
            validator: role => isValidObjectId(role),
            message: () => "Au champ 'administrativeUnit' doit correspondre un _id de role valide"
        },
		required: [true, "Le champ 'administrativeUnit' est requis"]
	},
	event: {
		type: String,
		ref: 'event',
		validate: {
            validator: event => isValidObjectId(event),
            message: () => "Au champ 'event' doit correspondre un _id de event valide"
        },
		required: false
	},
	form: {
		type: String,
		ref: 'form',
		validate: {
			validator: form => isValidObjectId(form),
			message: () => "Au champ 'form' doit correspondre un _id de form valide"
		},
		required: false
	}
}, { discriminatorKey: 'kind', timestamps: true });


archiveSchema.plugin(uniqueValidator);

//const archiveDB = mongoose.connection.useDb('archives');

const Archive = mongoose.model('archives', archiveSchema);

//const archiveSchemaProfil = archiveSchema.clone();

module.exports = Archive;
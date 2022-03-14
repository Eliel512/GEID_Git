const mongoose = require('mongoose'),
	{ Schema } = require('mongoose');
const uniqueValidator= require('mongoose-unique-validator');

const ressourceSchema = new Schema({
	createdAt: {
		type: Date,
		required: true,
		default: new Date(),
	},
	designation: {
		type: String,
		required: true, 
		unique: true
	},
	object: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		required: true,
	},
	type: {
		type: {type: String, required: true},
		subtype: {type: String, required: false}
	},
	createdBy: {
		id: {type: String, required: true},
		role: {type: String, required: true}
	},
	modifiedBy: {
		type: String,
		required: false
	},
	contentUrl: {
		type: String, 
		required: true
	},
	coverUrl: {
		type: String, 
		required: false
	}
}, { discriminatorKey: 'kind' });


ressourceSchema.plugin(uniqueValidator);

const archiveDB = mongoose.connection.useDb('archives');

const Ressource = archiveDB.model('ressource', ressourceSchema);

const ressourceSchemaFrozen = ressourceSchema.clone();

module.exports = { Ressource, ressourceSchemaFrozen };
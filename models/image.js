const mongoose = require('mongoose'), { Schema } = require('mongoose');
const uniqueValidator= require('mongoose-unique-validator');

const imageSchema = new Schema({
	createdAt: {
		type: Date,
		required: true,
		default: new Date(),
	},
	title: {
		type: String, 
		required: true,
		unique: true
	},
	description: {
		type: String,
		required: false
	},
	userId: {
		type: String,
		required: true
	},
	modifiedBy: {
		type: String,
		required: false
	},
	contentUrl: {
		type: String, 
		required: true
	}
}, {discriminatorKey: 'kind'});

imageSchema.plugin(uniqueValidator);

const mediaDB = mongoose.connection.useDb('mediatheque');

const Image = mediaDB.model('image', imageSchema);

const imageSchemaFrozen = imageSchema.clone();

module.exports = { Image, imageSchemaFrozen };
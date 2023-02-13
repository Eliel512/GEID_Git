const mongoose = require('mongoose'), { Schema } = require('mongoose');
const uniqueValidator= require('mongoose-unique-validator');

const imageSchema = new Schema({	
	title: {
		type: String, 
		required: true,
		unique: true
	},
	description: {
		type: String,
		required: false
	},
	event: {
		type: String,
		required: true
	},
	tags: {
		type: [String],
		required: true
	},	
	contentUrl: {
		type: String, 
		required: true
	}
}, {
	discriminatorKey: 'kind',
	timestamps: true
});

imageSchema.plugin(uniqueValidator);

const Image = mongoose.model('images', imageSchema);

const imageSchemaFrozen = imageSchema.clone();

module.exports = { Image, imageSchemaFrozen };
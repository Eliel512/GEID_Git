const mongoose = require('mongoose'), { Schema } = require('mongoose');
const uniqueValidator= require('mongoose-unique-validator');

const filmSchema = new Schema({	
	title: {
		type: String, 
		required: true,
		unique: true
	},
    description: {
		type: String, 
		required: true
	},
	event: {
		type: String,
		required: false
	},
	tags: {
		type: [String],
		required: false
	},
	contentUrl: {
		type: String, 
		required: true
	}
}, {
	discriminatorKey: 'kind',
	timestamps: true
});

filmSchema.plugin(uniqueValidator);

const Film = mongoose.model('films', filmSchema);

const filmSchemaFrozen = filmSchema.clone();

module.exports = { Film, filmSchemaFrozen };
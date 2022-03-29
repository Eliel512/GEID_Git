const mongoose = require('mongoose'), { Schema } = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const bookSchema = new Schema({
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
	author: {
		type: String, 
		required: true
	},
	type: {
		type: String,
		required: true,
		enum: ['LIVRE', 'ARTICLE SCIENTIFIQUE', 'REVUE', 'BROCHURE'],
		default: 'LIVRE'
	},
    description: {
		type: String, 
		required: true
	},
	userId: {
		type: String,
		required: true
	},
	modifiedBy: {
		type: String,
		required: false
	},
	coverUrl: {
		type: String, 
		required: false
	},
	contentUrl: {
		type: String, 
		required: true
	}
}, { discriminatorKey: 'kind' });

bookSchema.plugin(uniqueValidator);

const mediaDB = mongoose.connection.useDb('mediatheque');

const Book = mediaDB.model('book', bookSchema);

const bookSchemaFrozen = bookSchema.clone();

module.exports = { Book, bookSchemaFrozen };
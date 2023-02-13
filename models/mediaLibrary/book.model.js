const mongoose = require('mongoose'), { Schema } = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const bookSchema = new Schema({	
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
		enum: ['LIVRES', 'ARTICLES', 'REVUES', 'BROCHURES'],
		default: 'LIVRES'
	},
	tags: {
		type: [String],
		required: true
	},
    description: {
		type: String, 
		required: true
	},
	coverUrl: {
		type: String, 
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

bookSchema.plugin(uniqueValidator);

const Book = mongoose.model('books', bookSchema);

const bookSchemaFrozen = bookSchema.clone();

module.exports = { Book, bookSchemaFrozen };

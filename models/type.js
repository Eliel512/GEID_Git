const mongoose = require('mongoose'), { Schema } = require('mongoose');
const uniqueValidator= require('mongoose-unique-validator');

const typeSchema = new Schema({
	name: {
		type: String, 
		required: true, 
		unique: true
	},
	subtypes: {
		type: Array,
		required: false
	},
	coverUrl: {
		type: String, 
		required: false
	}
});


typeSchema.plugin(uniqueValidator);

const archiveDB = mongoose.connection.useDb('archives');

const Type = archiveDB.model('types', typeSchema);

module.exports = Type;
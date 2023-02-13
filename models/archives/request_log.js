const mongoose = require('mongoose'), { Schema } = require('mongoose');
const uniqueValidator= require('mongoose-unique-validator');

const requestSchema = new Schema({
    url: {
		type: String, 
		required: true
	},
    method: {
		type: String, 
		required: true
	},
    responseTime: {
		type: Number,
		required: true
	},
    day: {
		type: String,
		required: true
	},
    hour: {
		type: Number,
		required: true
	}
});

const RequestLog = mongoose.model('requestLog', requestSchema);

module.exports = RequestLog;
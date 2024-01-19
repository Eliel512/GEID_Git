const mongoose = require('mongoose'),
    { Schema } = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const { isValidObjectId } = require('../../tools/isValidObjectId');

const docSchema = new Schema({
    designation: {
        type: String,
        required: [true, "Le champ 'designation' est requis"],
        // unique: true
    },
    tags: {
		type: [String],
		required: false
	},
    format: {
        type: String,
        required: true
    },
    contentUrl: {
        type: String,
        required: true
    }
}, { timestamps: true });

// docSchema.plugin(uniqueValidator);

const Doc = mongoose.model('doc', docSchema);

module.exports = Doc;
const mongoose = require('mongoose'),
	{ Schema } = require('mongoose');
const isValidObjectId = require('../../tools/isValidObjectId');
const uniqueValidator= require('mongoose-unique-validator');

const eventSchema = new Schema({	
	name: {
		type: String,
		required: [true, "Le champ 'name' est requis"],
		set: v => v.toUpperCase(),
		unique: true
	},
    endDate: {
		type: Date,
        required: [true, "Le champ 'endDate' est requis"]
	},
	description: {
		type: String,
		required: [true, "Le champ 'description' est requis"],
	},	
	administrativeUnits: {
		type: [String],
        ref: 'role',
        validate: {
            validator: roles => roles.every(isValidObjectId),
            message: () => "Au champ 'administrativeUnits' doivent correspondre des _id de role valides"
        },
        required: [true, "Le champ 'administrativeUnits' est requis"]
	}},{
        timestamps: {
            createdAt: 'startDate', // Use `startDate` to store the created date
            //updatedAt: 'endDate' // and `endDate` to store the last updated date
        }
});

eventSchema.index({ endDate: 1 }, { expireAfterSeconds: 172800, name: 'end_date' });

eventSchema.plugin(uniqueValidator);

const Event = mongoose.model('events', eventSchema);

module.exports = Event 
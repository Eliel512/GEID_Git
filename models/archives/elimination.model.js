const mongoose = require('mongoose');
const { Schema } = mongoose;

const eliminationSchema = new Schema({
	// Archives concerned
	archives: [{
		type: String,
		ref: 'archives'
	}],

	// PV details
	pvNumber: {
		type: String,
		unique: true
	},
	pvDate: {
		type: Date,
		default: Date.now
	},
	motif: {
		type: String,
		required: [true, "Le motif d'élimination est requis"]
	},

	// Validation workflow
	status: {
		type: String,
		enum: ['DRAFT', 'PENDING_PRODUCER', 'PENDING_DANTIC', 'APPROVED', 'REJECTED', 'EXECUTED'],
		default: 'DRAFT'
	},

	// Signatories
	createdBy: {
		type: String,
		ref: 'users'
	},
	producerApproval: {
		approved: { type: Boolean },
		approvedBy: { type: String, ref: 'users' },
		approvedAt: { type: Date },
		note: { type: String }
	},
	danticApproval: {
		approved: { type: Boolean },
		approvedBy: { type: String, ref: 'users' },
		approvedAt: { type: Date },
		note: { type: String }
	},

	// Execution
	executedAt: { type: Date },
	executedBy: { type: String, ref: 'users' },

	// Administrative unit
	administrativeUnit: {
		type: String
	}
}, { timestamps: true });

module.exports = mongoose.model('elimination', eliminationSchema);

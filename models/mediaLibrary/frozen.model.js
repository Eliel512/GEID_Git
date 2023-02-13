const mongoose = require('mongoose'), { Schema } = require('mongoose');
//const { ressourceSchemaFrozen } = require('./ressource');
const { bookSchemaFrozen } = require('./book.model');
const { imageSchemaFrozen } = require('./image.model');
const { filmSchemaFrozen } = require('./film.model');

const frozenSchema = new Schema({
    createdBy: {
		id: {type: String, required: true},
		role: {type: String, required: true}
	},
    frozenType: {
        type: String,
        enum: ['ressource', 'book', 'image', 'film'],
        required: true
    },
    fileUrl: {
        type: String,
        required: [true, 'fileUrl are required'],
    }
}, {
    discriminatorKey: 'kind',
    timestamps: {
		createdAt: 'sendedAt', // Use `sendedAt` to store the created date
		//updatedAt: 'updated_at' // and `updated_at` to store the last updated date
	}
   });

frozenSchema.index({ sendedAt: 1 }, { expireAfterSeconds: 604800, name: 'sendet_At' });

const Frozen = mongoose.model('frozens', frozenSchema);

const bookFrozen = Frozen.discriminator('bookFrozen', bookSchemaFrozen);
const imageFrozen = Frozen.discriminator('imageFrozen', imageSchemaFrozen);
const filmFrozen = Frozen.discriminator('filmFrozen', filmSchemaFrozen);
//const ressourceFrozen = Frozen.discriminator('ressourceFrozen', ressourceSchemaFrozen);

module.exports = { Frozen, bookFrozen, imageFrozen, filmFrozen };
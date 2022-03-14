const mongoose = require('mongoose'), { Schema } = require('mongoose');
const { ressourceSchemaFrozen } = require('./ressource');
const { bookSchemaFrozen } = require('./book');
const { imageSchemaFrozen } = require('./image');
const { filmSchemaFrozen } = require('./film');

const frozenSchema = new Schema({
    sendedAt: {
	    type: Date,
	    required: true,
	    default: new Date()/*.toLocaleString('en-GB', { timeZone: 'Africa/Lagos' })*/,
	},
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
}, { discriminatorKey: 'kind' });

const archiDB = mongoose.connection.useDb('archives');

const Frozen = archiDB.model('frozen', frozenSchema);

const bookFrozen = Frozen.discriminator('bookFrozen', bookSchemaFrozen);
const imageFrozen = Frozen.discriminator('imageFrozen', imageSchemaFrozen);
const filmFrozen = Frozen.discriminator('filmFrozen', filmSchemaFrozen);
const ressourceFrozen = Frozen.discriminator('ressourceFrozen', ressourceSchemaFrozen);

module.exports = { Frozen, bookFrozen, imageFrozen, filmFrozen, ressourceFrozen };
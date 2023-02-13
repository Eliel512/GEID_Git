const mongoose = require('mongoose'), { Schema } = require('mongoose');
const { isValidObjectId } = require('../../tools/isValidObjectId');
const uniqueValidator= require('mongoose-unique-validator');
const { autoIncrement } = require('mongoose-plugin-autoinc');
/*const { ressourceSchemaFrozen } = require('./ressource');
const { bookSchemaFrozen } = require('./book');
const { imageSchemaFrozen } = require('./image');
const { filmSchemaFrozen } = require('./film');*/

const retentionSchema = new Schema({
    arrangement: {
        type: String,
        enum: ['Conservation', 'Destruction'],
	    required: [true, "Le champ 'arrangement' est requis"]
    }
}, { discriminatorKey: 'kind' });

retentionSchema.plugin(autoIncrement, {
    model: 'retention',
    field: 'number',
    startAt: 1
    });
retentionSchema.plugin(uniqueValidator);

const Retention = mongoose.model('retentions', retentionSchema);

module.exports = Retention;
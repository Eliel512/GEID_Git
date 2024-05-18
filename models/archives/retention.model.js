const mongoose = require('mongoose'), { Schema } = require('mongoose');
// const { isValidObjectId } = require('../../tools/isValidObjectId');
const uniqueValidator= require('mongoose-unique-validator');
// const { autoIncrement } = require('mongoose-plugin-autoinc');
/*const { ressourceSchemaFrozen } = require('./ressource');
const { bookSchemaFrozen } = require('./book');
const { imageSchemaFrozen } = require('./image');
const { filmSchemaFrozen } = require('./film');*/

/*
 * Creation du modele mongoose des calendriers
 *  de conservation
*/

const retentionSchema = new Schema({

    // Nom du calendrier
    name: {
        type: String,
        required: true,
        unique: true
    },
    // Description du calendrier
    description: {
        type: String,
        required: false
    },
    // Delai de conservation en annees
    delai: {
        type: Number,
        required: true
    },
    // Disposition apres delai de conservation
    arrangement: {
        arrangement: {
            type: String,
            enum: ['Conservation', 'Destruction'],
            required: [true, "Le champ 'arrangement' est requis"]
        },
        // Motif de l'arrangement
        motif: {
            type: String,
            required: true
        }
    }
}, { timestamps: true });

// retentionSchema.plugin(autoIncrement, {
//     model: 'retention',
//     field: 'number',
//     startAt: 1
//     });
retentionSchema.plugin(uniqueValidator);

const Retention = mongoose.model('retention', retentionSchema);

module.exports = Retention;
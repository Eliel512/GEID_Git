const mongoose = require('mongoose'),
    { Schema } = require('mongoose');
// const isValidObjectId = require('../../tools/isValidObjectId');
const uniqueValidator = require('mongoose-unique-validator');

const folderSchema = new Schema({
    name: {
        type: String,
        required: [true, "Le champ 'name' est requis"],
        set: v => v.toUpperCase(),
        unique: true
    },
    description: {
        type: String,
        required: [true, "Le champ 'description' est requis"],
    }
});

folderSchema.plugin(uniqueValidator);

const Folder = mongoose.model('folder', folderSchema);

module.exports = Folder;
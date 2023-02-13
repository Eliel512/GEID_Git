const Joi = require('joi');
const Type = require('../../models/archives/type.model');

const invalidSchema = Joi.object({
    fileName: Joi.string()
        .alphanum()
        .required(),

    designation: Joi.string()
        .required(),

    description: Joi.string()        
        .min(3)
        .required(),

    event: Joi.string()        
        .required(),

    type: Joi.string()
        .uppercase()
        .required(),

    subtype: Joi.string()
        .uppercase()
        .required(),

    notes: Joi.string()        
        .optional()
});

module.exports = async (req, res, next) => {
    const { error, value } = invalidSchema.validate({
        fileName: req.body.fileName,
        designation: req.body.designation,
        description: req.body.description,        
        event: req.body.event,
        type: req.body.type,
        subtype: req.body.subtype,
        notes: req.body.notes
    });
    if(error){
        return res.status(400).json(error.details);
    }

    typeExists = await Type.exists({ name: req.body.type, subtypes: req.body.subtype });

    if(!typeExists){
        return res.status(400).json({ message: '\'type\' incorrect' });
    }
    next();
};
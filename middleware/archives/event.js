const Joi = require('joi');
const Role = require('../../models/users/role.model');

const eventSchema = Joi.object({
    name: Joi.string()
        .alphanum()
        .required(),

    description: Joi.string()
        .min(3)
        .required(),

    endDate: Joi.date()
        .required(),

    administrativeUnits: Joi.array()
        .items(Joi.string())
        .required(),

});

module.exports = async (req, res, next) => {
    const { error, value } = eventSchema.validate({
        name: req.body.name,
        description: req.body.description,
        endDate: req.body.endDate,
        administrativeUnits: req.body.administrativeUnits
    });
    if (error) {
        return res.status(400).json(error.details);
    }

    for (const role of req.body.administrativeUnits){
        roleExists = await Role.exists({ name: role });
        if(!roleExists){
            return res.status(400).json({ message: `Role ${role} inexistant` });
        }
    }
    next();
};
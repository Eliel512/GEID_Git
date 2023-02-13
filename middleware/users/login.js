const Joi = require('joi');

const loginSchema = Joi.object({
    email: Joi.string()
        .email({ minDomainSegments: 2, allowFullyQualified: true })
        .min(5)
        .required(),

    password: Joi.string()
        .min(3)
        .required()
});

module.exports = (req, res, next) => {
    const { error, value } = loginSchema.validate({ email: req.body.email, password: req.body.password });
    if(error){
        return res.status(400).json(error.details);
    }
    next();
};
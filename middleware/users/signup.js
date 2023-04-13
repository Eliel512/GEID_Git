const Joi = require('joi');

const signupSchema = Joi.object({
    fname: Joi.string()
        .min(2)
        .required(),

    lname: Joi.string()
        .min(2)
        .required(),

    mname: Joi.string()
        .min(2)
        .optional(),
    
    email: Joi.string()
        .email({ minDomainSegments: 2, allowFullyQualified: true })
        .min(5)
        .required(),

    grade: Joi.string()
        .min(5)
        .uppercase()
        .required(),

    role: Joi.string()
        .min(10)
        .uppercase()
        .required(),    
       
    phoneCell: Joi.string()
        .min(10)
        .pattern(/^[0-9]+$/)
        .required(),
    
    password: Joi.string()
        .min(3)
        .required()
});

module.exports = (req, res, next) => {
    console.log(req.body);
    const { error, value } = signupSchema.validate({
        fname: req.body.fname,
        lname: req.body.lname,
        mname: req.body.mname,
        email: req.body.email,
        grade: req.body.grade.grade,
        role: req.body.grade.role.label,
        phoneCell: req.body.phoneCell,
        password: req.body.password
    });
    if (error) {
        console.log(error.details);
        return res.status(400).json(error.details);
    }
    next();
};
const Joi = require("joi");

module.exports = Joi.object({
  _id: Joi.string().length(6).required(),
  start: Joi.number().required(),
  duration: Joi.object({
    hours: Joi.number(),
    minutes: Joi.number(),
    seconds: Joi.number().required(),
  }).required(),
  summary: Joi.string(),
  description: Joi.string(),
  location: Joi.string().required(),
  participants: Joi.array().items(
    Joi.object({
      identity: Joi.string().required(),
      state: Joi.object({
        isOrganizer: Joi.boolean().required(),
        handRaised: Joi.boolean().required(),
        screenShared: Joi.boolean().required(),
        isCamActive: Joi.boolean(),
        isMicActive: Joi.boolean(),
        isInRoom: Joi.boolean().required(),
      }).required(),
      auth: Joi.object({
        shareScreen: Joi.boolean().required(),
      }).required(),
    }).required()
  ),
  callDetails: Joi.object({}).unknown().required(),
});

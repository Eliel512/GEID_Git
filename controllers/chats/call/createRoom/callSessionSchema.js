const Joi = require("joi");

const durationSchema = Joi.object({
  hours: Joi.number(),
  minutes: Joi.number(),
  seconds: Joi.number(),
});

const participantStateSchema = Joi.object({
  isOrganizer: Joi.boolean(),
  handRaised: Joi.boolean(),
  screenShared: Joi.boolean(),
  isCamActive: Joi.boolean(),
  isMicActive: Joi.boolean(),
  isInRoom: Joi.boolean(),
});

const participantAuthSchema = Joi.object({
  shareScreen: Joi.boolean(),
  writeMessage: Joi.boolean().default(true),
  react: Joi.boolean().default(true),
});

const participantSchema = Joi.object({
  identity: Joi.string().required(),
  itemModel: Joi.string().valid("users", "guests").required(),
  uid: Joi.number().required(),
  screenId: Joi.number().required(),
  state: participantStateSchema,
  auth: participantAuthSchema,
});

const guestSchema = Joi.object({
  identity: Joi.string().required(),
  itemModel: Joi.string().valid("users", "guests").required(),
});

const messageSchema = Joi.object({
  content: Joi.string().required(),
  sender: Joi.alternatives().try(Joi.string(), Joi.object()).required(),
  createdAt: Joi.date().required(),
  clientId: Joi.string().required(),
  ref: Joi.string(),
});

const callDetailsSchema = Joi.object({
  TOKEN: Joi.string().required(),
  UID: Joi.number(),
  APP_ID: Joi.string().required(),
  EXPIRE_AT: Joi.alternatives()
    .try(Joi.date(), Joi.number(), Joi.string())
    .required(),
});

const callSessionSchema = Joi.object({
  _id: Joi.string().required(),
  title: Joi.string(),
  startedAt: Joi.date().iso().required(),
  endedAt: Joi.date().iso(),
  duration: durationSchema,
  summary: Joi.string(),
  description: Joi.string(),
  createdBy: Joi.string().required(),
  location: Joi.string().required(),
  room: Joi.any(),
  status: Joi.number().required(),
  participants: Joi.array().items(participantSchema).required(),
  guests: Joi.array().items(guestSchema).required(),
  messages: Joi.array().items(messageSchema),
  callDetails: callDetailsSchema,
  createdAt: Joi.date().required(),
  updatedAt: Joi.date().required(),
});

module.exports = callSessionSchema;

const Joi = require('joi');

exports.loginSchema = Joi.object({
  login: Joi.alternatives().try(
    Joi.string().email(),
    Joi.string().pattern(/^\d+$/) // matricula o num_empleado
  ).required(),
  password: Joi.string().min(6).required()
});

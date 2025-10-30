const Joi = require('joi');

exports.markAsistencia = Joi.object({
  id_provision: Joi.number().integer().required(),
  id_usuario: Joi.number().integer().required(),
  asistio: Joi.number().valid(0,1).required()
});

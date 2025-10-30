const Joi = require('joi');

exports.addMiembro = Joi.object({
  id_familia: Joi.number().integer().required(),
  id_usuario: Joi.number().integer().required(),
  tipo_miembro: Joi.string().valid('PADRE','MADRE','HIJO').required(),
}).options({ stripUnknown: true });

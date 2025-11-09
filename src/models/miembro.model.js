const Joi = require('joi');

exports.addMiembro = Joi.object({
  id_familia: Joi.number().integer().required(),
  id_usuario: Joi.number().integer().required(),
  tipo_miembro: Joi.string().valid('PADRE','MADRE','HIJO', 'ALUMNO_ASIGNADO').required(),
}).options({ stripUnknown: true });


exports.addMiembrosBulk = Joi.object({
  id_familia: Joi.number().integer().required(),
  id_usuarios: Joi.array().items(Joi.number().integer()).min(1).required(),
}).options({ stripUnknown: true });
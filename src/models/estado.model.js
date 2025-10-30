const Joi = require('joi');

exports.createEstado = Joi.object({
  id_usuario: Joi.number().integer().required(),
  tipo_estado: Joi.string().max(50).required(),
  fecha_inicio: Joi.date().iso().optional(),
  fecha_fin: Joi.date().iso().allow(null),
  unico_vigente: Joi.boolean().default(true)
});

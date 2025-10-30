const Joi = require('joi');

exports.createPublicacion = Joi.object({
  id_familia: Joi.number().integer().allow(null),
  id_usuario: Joi.number().integer().required(),
  categoria_post: Joi.string().valid('Familiar','Institucional').required(),
  mensaje: Joi.string().max(500).allow(null,'')
});

exports.setEstadoPublicacion = Joi.object({
  estado: Joi.string().valid('Pendiente','Aprobada','Rechazada').required()
});

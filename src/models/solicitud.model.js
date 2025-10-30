const Joi = require('joi');

exports.createSolicitud = Joi.object({
  id_familia: Joi.number().integer().required(),
  id_usuario: Joi.number().integer().required(),
  tipo_solicitud: Joi.string().valid('Solicitud','Invitación').required()
});

exports.setEstadoSolicitud = Joi.object({
  estado: Joi.string().valid('Pendiente','Aceptada','Rechazada').required()
});

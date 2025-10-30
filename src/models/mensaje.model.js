const Joi = require('joi');

exports.sendMensaje = Joi.object({
  id_familia: Joi.number().integer().required(),
  id_usuario: Joi.number().integer().required(),
  contenido: Joi.string().max(500).required()
});

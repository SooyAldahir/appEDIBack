const Joi = require('joi');

exports.createProvision = Joi.object({
  id_familia: Joi.number().integer().required(),
  fecha: Joi.date().iso().required(),
  cantidad_cenas: Joi.number().integer().min(0).required(),
  comentario: Joi.string().max(255).allow(null,'')
});

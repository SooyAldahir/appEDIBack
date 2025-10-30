const Joi = require('joi');

exports.addFoto = Joi.object({
  id_post: Joi.number().integer().required(),
  url_foto: Joi.string().uri().required()
});

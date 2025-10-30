const Joi = require('joi');

exports.createActividad = Joi.object({
  titulo: Joi.string().max(150).required(),
  descripcion: Joi.string().max(500).allow(null,''),
  fecha_evento: Joi.date().iso().required(), // YYYY-MM-DD
  hora_evento: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).allow(null,''),
  imagen: Joi.string().uri().allow(null,''),
  estado_publicacion: Joi.string().valid('Programada','Publicada','Finalizada').default('Programada')
});

exports.updateActividad = Joi.object({
  titulo: Joi.string().max(150),
  descripcion: Joi.string().max(500).allow(null,''),
  fecha_evento: Joi.date().iso(),
  hora_evento: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).allow(null,''),
  imagen: Joi.string().uri().allow(null,''),
  estado_publicacion: Joi.string().valid('Programada','Publicada','Finalizada')
});

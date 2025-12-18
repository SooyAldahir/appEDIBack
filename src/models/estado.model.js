// src/models/estado.model.js
const Joi = require('joi');

exports.createEstado = Joi.object({
  id_usuario: Joi.number().integer().required(),
  
  // NUEVO: Agregamos el ID del catálogo como requerido
  id_cat_estado: Joi.number().integer().required(), 

  // MODIFICADO: El tipo_estado ya no es required(), ahora es opcional o allow(null)
  tipo_estado: Joi.string().max(50).allow('', null),

  fecha_inicio: Joi.date().iso().optional(),
  fecha_fin: Joi.date().iso().allow(null),
  unico_vigente: Joi.boolean().default(true)
});
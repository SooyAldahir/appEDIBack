const Joi = require('joi');

const residenciaEnum = Joi.string().valid('INTERNA', 'EXTERNA');

exports.createFamilia = Joi.object({
  nombre_familia: Joi.string().max(100).required(),
  residencia: residenciaEnum.required(),
  direccion: Joi.when('residencia', {
    is: 'EXTERNA',
    then: Joi.string().trim().min(5).max(255).required(),
    otherwise: Joi.string().allow(null, '').optional(),
  }),
  papa_id: Joi.number().integer().allow(null),
  mama_id: Joi.number().integer().allow(null),
  hijos: Joi.array().items(Joi.number().integer()).optional(),
  descripcion: Joi.string().max(255).allow(null, ''),
}).options({ stripUnknown: true });

exports.updateFamilia = Joi.object({
  nombre_familia: Joi.string().max(100),
  residencia: residenciaEnum,
  direccion: Joi.when('residencia', {
    is: 'EXTERNA',
    then: Joi.string().trim().min(5).max(255).required(),
    otherwise: Joi.string().allow(null, ''),
  }),
  papa_id: Joi.number().integer().allow(null),
  mama_id: Joi.number().integer().allow(null),
  descripcion: Joi.string().max(255).allow(null, ''),
}).options({ stripUnknown: true });
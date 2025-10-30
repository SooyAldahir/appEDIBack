// src/models/usuario.model.js
const Joi = require('joi');

const baseUser = {
  nombre: Joi.string().min(1).max(100).required(),
  apellido: Joi.string().allow('', null).max(100),
  correo: Joi.string().email().required(),
  contrasena: Joi.string().min(6).required(),
  foto_perfil: Joi.string().uri().allow('', null),
  tipo_usuario: Joi.string().valid('ALUMNO', 'EMPLEADO', 'EXTERNO').required(),
  matricula: Joi.number().integer().allow(null),
  num_empleado: Joi.number().integer().allow(null),
  id_rol: Joi.number().integer().required(),

  // NUEVOS
  telefono: Joi.string().allow('', null).max(20),
  residencia: Joi.string().valid('Interna', 'Externa').allow(null),
  direccion: Joi.string().allow('', null).max(200),
  fecha_nacimiento: Joi.date().iso().allow(null),  // ← ISO: 'YYYY-MM-DD'
  carrera: Joi.string().allow('', null).max(120),
};

const createUserSchema = Joi.object(baseUser);
const updateUserSchema = Joi.object({
  nombre: Joi.string().allow(null, ''),
  apellido: Joi.string().allow(null, ''),
  foto_perfil: Joi.string().uri().allow(null, ''),
  estado: Joi.string().allow(null, ''),
  activo: Joi.boolean().allow(null),

  telefono: Joi.string().allow(null, ''),
  residencia: Joi.string().valid('Interna', 'Externa').allow(null),
  direccion: Joi.string().allow(null, ''),
  fecha_nacimiento: Joi.date().iso().allow(null),
  carrera: Joi.string().allow(null, ''),
});

module.exports = { createUserSchema, updateUserSchema };

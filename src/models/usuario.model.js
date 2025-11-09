// src/models/usuario.model.js
const Joi = require('joi');

// --- ESQUEMA DE CREACIÓN ACTUALIZADO ---
const createUserSchema = Joi.object({
  nombre: Joi.string().min(1).max(100).required(),
  apellido: Joi.string().allow('', null).max(100),
  correo: Joi.string().email().required().regex(/@ulv\.edu\.mx$/).message('El correo debe ser institucional (@ulv.edu.mx)'),
  contrasena: Joi.string().min(6).required(),
  foto_perfil: Joi.string().uri().allow('', null),
  tipo_usuario: Joi.string().valid('ALUMNO', 'EMPLEADO', 'EXTERNO').required(),
  id_rol: Joi.number().integer().required(),

  // Lógica condicional para matrícula y num_empleado
  matricula: Joi.when('tipo_usuario', {
    is: 'ALUMNO',
    then: Joi.number().integer().required(),
    otherwise: Joi.allow(null),
  }),
  num_empleado: Joi.when('tipo_usuario', {
    is: 'EMPLEADO',
    then: Joi.number().integer().required(),
    otherwise: Joi.allow(null),
  }),

  // NUEVOS (se quedan igual)
  telefono: Joi.string().allow('', null).max(20),
  residencia: Joi.string().valid('Interna', 'Externa').allow(null),
  direccion: Joi.string().allow('', null).max(200),
  fecha_nacimiento: Joi.date().iso().allow(null),
  carrera: Joi.string().allow('', null).max(120),
}).options({ stripUnknown: true });
// --- FIN DEL ESQUEMA DE CREACIÓN ---


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
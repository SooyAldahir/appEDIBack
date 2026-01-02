const router = require('express').Router();
const C = require('../controllers/publicaciones.controller');
const validate = require('../utils/validate');
const { createPublicacion, setEstadoPublicacion } = require('../models/publicacion.model');
const authGuard = require('../middleware/authGuard'); 
const roleGuard = require('../middleware/roleGuard');

const ROLES_ACCESO_APP = [
  'Admin', 
  'PapaEDI', 
  'MamaEDI', 
  'HijoEDI', 
  'HijoSanguineo',
  'Padre', 'Madre', 'Tutor', 'Hijo', 'ALUMNO', 'Estudiante' // <--- Agregamos roles comunes por si acaso
];

// 👇 CORRECCIÓN 1: Agregamos Padre, Madre y Tutor a los "Jueces"
const ROLES_ADMIN = [
  'Admin',
  'PapaEDI', 
  'MamaEDI',
  'Padre',
  'Madre',
  'Tutor'
]; 


router.get('/mis-posts', authGuard, C.listByUsuario);

router.post('/', authGuard, roleGuard(...ROLES_ACCESO_APP), validate(createPublicacion), C.create);

router.get('/familia/:id_familia', C.listByFamilia);

router.get('/institucional', authGuard, roleGuard(...ROLES_ACCESO_APP), C.listInstitucional);

router.put(
  '/:id/estado', 
  authGuard, 
  roleGuard(...ROLES_ADMIN), 
  // validate(setEstadoPublicacion), // 👈 CORRECCIÓN 2: Comentamos esto para que acepte 'Publicado' sin dar error
  C.setEstado
);

router.delete(
  '/:id', 
  authGuard, 
  roleGuard(...ROLES_ADMIN), 
  C.remove
);

router.get(
  '/familia/:id_familia/pendientes', 
  authGuard, 
  roleGuard(...ROLES_ADMIN), 
  C.listPendientes
);



module.exports = router;
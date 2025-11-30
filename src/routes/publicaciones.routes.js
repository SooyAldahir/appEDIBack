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
  'HijoSanguineo'
];

router.post('/', authGuard, roleGuard(...ROLES_ACCESO_APP), validate(createPublicacion), C.create);

router.get('/familia/:id_familia', C.listByFamilia);

router.get('/institucional', authGuard, roleGuard(...ROLES_ACCESO_APP), C.listInstitucional);

const ROLES_ADMIN = [
    'Admin',
  'PapaEDI', 
  'MamaEDI' ]; 

router.put(
  '/:id/estado', 
  authGuard, 
  roleGuard(...ROLES_ADMIN), // Solo Admin puede aprobar/rechazar
  validate(setEstadoPublicacion), 
  C.setEstado
);

router.delete(
  '/:id', 
  authGuard, 
  roleGuard(...ROLES_ADMIN), // Solo Admin puede eliminar posts
  C.remove
);

module.exports = router;
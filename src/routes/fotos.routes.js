const router = require('express').Router();
const C = require('../controllers/fotos.controller');
const validate = require('../utils/validate');
const { addFoto } = require('../models/foto.model');
// 1. IMPORTAR MIDDLEWARE DE AUTORIZACIÓN Y ROLES
const authGuard = require('../middleware/authGuard'); 
const roleGuard = require('../middleware/roleGuard'); //

// 2. DEFINIR ROLES PERMITIDOS PARA EDITAR FOTOS
// Admin y Padres (PapaEDI, MamaEDI)
const ROLES_FOTOS_EDIT = [
  'Admin', 
  'PapaEDI', 
  'MamaEDI'
];

router.post(
  '/', 
  authGuard, // Asegura que el usuario esté logueado (buena práctica)
  roleGuard(...ROLES_FOTOS_EDIT), // <-- AÑADIDO: RESTRICCIÓN DE ROLES
  validate(addFoto), 
  C.add
);

router.get('/post/:id_post', C.listByPost);
router.get('/familia/:id_familia', C.listByFamilia);

module.exports = router;
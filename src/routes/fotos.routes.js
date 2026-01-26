const router = require('express').Router();
const C = require('../controllers/fotos.controller');
const validate = require('../utils/validate');
const { addFoto } = require('../models/foto.model');
const authGuard = require('../middleware/authGuard'); 
const roleGuard = require('../middleware/roleGuard'); 

const ROLES_FOTOS_EDIT = [
  'Admin', 
  'PapaEDI', 
  'MamaEDI'
];

router.post(
  '/', 
  authGuard,
  roleGuard(...ROLES_FOTOS_EDIT), 
  validate(addFoto), 
  C.add
);

router.get('/post/:id_post', C.listByPost);
router.get('/familia/:id_familia', C.listByFamilia);

module.exports = router;
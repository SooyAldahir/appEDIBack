const router = require('express').Router();
const C = require('../controllers/agenda.controller');
const auth = require('../middleware/authGuard'); 
const allow = require('../middleware/roleGuard');

// Modificar la agenda
const ROLES_ADMIN = ['Admin']; 

// Listar
router.get('/', auth, C.list);

// Crear
router.post('/', auth, allow(...ROLES_ADMIN), C.create);

// Editar
router.put('/:id', auth, allow(...ROLES_ADMIN), C.update);

// Eliminar
router.delete('/:id', auth, allow(...ROLES_ADMIN), C.remove);

module.exports = router;
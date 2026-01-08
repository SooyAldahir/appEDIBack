const router = require('express').Router();
const C = require('../controllers/agenda.controller');
const auth = require('../middleware/authGuard'); 
const allow = require('../middleware/roleGuard');

// Roles que pueden MODIFICAR la agenda
const ROLES_ADMIN = ['Admin', 'PapaEDI', 'MamaEDI']; 

// 👇 1. ESTA ES LA RUTA QUE FALTABA (Listar)
// La dejamos con 'auth' para que cualquier usuario logueado pueda ver la lista completa si es necesario,
// o puedes quitarle 'auth' si quieres que sea pública.
router.get('/', auth, C.list);

// 👇 2. Rutas de ADMINISTRACIÓN (Protegidas con RoleGuard)
// Crear
router.post('/', auth, allow(...ROLES_ADMIN), C.create);

// Editar
router.put('/:id', auth, allow(...ROLES_ADMIN), C.update);

// Eliminar
router.delete('/:id', auth, allow(...ROLES_ADMIN), C.remove);

module.exports = router;
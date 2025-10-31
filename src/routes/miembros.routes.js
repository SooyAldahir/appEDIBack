const router = require('express').Router();
const C = require('../controllers/miembros.controller');
const validate = require('../utils/validate');
const { addMiembro, addMiembrosBulk } = require('../models/miembro.model');
const auth = require('../middleware/authGuard');
const allow = require('../middleware/roleGuard');

// Ruta para crear un solo miembro
router.post('/',
  auth,
  allow('Admin'),
  validate(addMiembro),
  C.add
);

// Ruta para asignar múltiples alumnos (esta es la que usa el frontend)
router.post('/bulk',
  auth,
  allow('Admin'),
  validate(addMiembrosBulk),
  C.addBulk
);

// Ruta para listar miembros de una familia
router.get('/familia/:id', C.byFamilia);

module.exports = router;
const router = require('express').Router();
const C = require('../controllers/miembros.controller');
const validate = require('../utils/validate');
const { addMiembro } = require('../models/miembro.model');
const auth = require('../middleware/authGuard');
const allow = require('../middleware/roleGuard');

// 🔍 Diagnóstico: imprime tipos antes de registrar rutas
console.log('miembros.routes types:', {
  C_add: typeof C?.add,
  C_byFamilia: typeof C?.byFamilia,
  validate: typeof validate,
  addMiembro_hasValidate: typeof addMiembro?.validate,
  auth: typeof auth,
  allow: typeof allow,
});

// Pequeño helper para evitar crash si algo viene mal
const mw = (fn, name) => {
  if (typeof fn !== 'function') {
    console.error(`✗ Middleware/handler "${name}" no es función ->`, fn);
    // middleware no-op para no romper el arranque
    return (_req, _res, next) => next();
  }
  return fn;
};

// Crear miembro
router.post('/',
  mw(auth, 'auth'),
  mw(allow('Admin'), 'allow(Admin)'),
  mw(validate(addMiembro), 'validate(addMiembro)'),
  mw(C.add, 'C.add'),
);

// Listar por familia
router.get('/familia/:id',
  mw(C.byFamilia, 'C.byFamilia'),
);

// (opcional) eliminar miembro
// router.delete('/:id',
//   mw(auth, 'auth'),
//   mw(allow('Admin'), 'allow(Admin)'),
//   mw(C.remove, 'C.remove'),
// );

module.exports = router;

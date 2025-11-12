const router = require('express').Router();
const C = require('../controllers/familias.controller');
const validate = require('../utils/validate');
const { createFamilia, updateFamilia } = require('../models/familia.model');
const auth = require('../middleware/authGuard');
const allow = require('../middleware/roleGuard');

// Crear / actualizar / borrar (solo Admin)
router.post('/',  auth, allow('Admin'), validate(createFamilia), C.create);
router.put('/:id', auth, allow('Admin'), validate(updateFamilia), C.update);
router.delete('/:id', auth, allow('Admin'), C.remove);

router.patch('/:id/fotos',
  auth,
  allow('Admin'), // O puedes cambiarlo a allow('PapaEDI', 'MamaEDI') si quieres que ellos editen
  C.uploadFotos
);

// Lectura (⚠️ orden importa)
router.get('/search', C.searchByName);
router.get('/por-ident/:ident', C.byIdent);
router.get('/reporte-completo', auth, allow('Admin'), C.reporteCompleto);
router.get('/', C.list);
router.get('/:id', C.get);

module.exports = router;

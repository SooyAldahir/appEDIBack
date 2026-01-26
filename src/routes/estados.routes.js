const router = require('express').Router();
const C = require('../controllers/estados.controller');
const validate = require('../utils/validate');
const { createEstado } = require('../models/estado.model');

router.get('/catalogo', C.getCatalog); 
router.post('/', validate(createEstado), C.create);
router.get('/usuario/:id_usuario', C.listByUsuario);
router.put('/:id/cerrar', C.close);

module.exports = router;
const router = require('express').Router();
const C = require('../controllers/publicaciones.controller');
const validate = require('../utils/validate');
const { createPublicacion, setEstadoPublicacion } = require('../models/publicacion.model');

router.post('/', validate(createPublicacion), C.create);
router.get('/familia/:id_familia', C.listByFamilia);
router.get('/institucional', C.listInstitucional);
router.put('/:id/estado', validate(setEstadoPublicacion), C.setEstado);
router.delete('/:id', C.remove);

module.exports = router;

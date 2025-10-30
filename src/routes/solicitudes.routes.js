const router = require('express').Router();
const C = require('../controllers/solicitudes.controller');
const validate = require('../utils/validate');
const { createSolicitud, setEstadoSolicitud } = require('../models/solicitud.model');

router.post('/', validate(createSolicitud), C.create);
router.put('/:id/estado', validate(setEstadoSolicitud), C.setEstado);
router.get('/familia/:id_familia', C.listByFamilia);

module.exports = router;

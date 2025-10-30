const router = require('express').Router();
const C = require('../controllers/det_provisiones.controller');
const validate = require('../utils/validate');
const { markAsistencia } = require('../models/det_provision.model');

// marca/actualiza asistencia de un usuario en una provisión
router.post('/', validate(markAsistencia), C.mark);
// lista detalle por provisión
router.get('/provision/:id_provision', C.listByProvision);

module.exports = router;

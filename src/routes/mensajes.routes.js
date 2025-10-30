const router = require('express').Router();
const C = require('../controllers/mensajes.controller');
const validate = require('../utils/validate');
const { sendMensaje } = require('../models/mensaje.model');

router.post('/', validate(sendMensaje), C.send);
router.get('/familia/:id_familia', C.listByFamilia);

module.exports = router;

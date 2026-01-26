const router = require('express').Router();
const C = require('../controllers/det_provisiones.controller');
const validate = require('../utils/validate');
const { markAsistencia } = require('../models/det_provision.model');


router.post('/', validate(markAsistencia), C.mark);

router.get('/provision/:id_provision', C.listByProvision);

module.exports = router;

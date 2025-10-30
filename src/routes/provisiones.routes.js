const router = require('express').Router();
const C = require('../controllers/provisiones.controller');
const validate = require('../utils/validate');
const { createProvision } = require('../models/provision.model');

router.post('/', validate(createProvision), C.create);
router.get('/familia/:id_familia', C.listByFamilia);

module.exports = router;

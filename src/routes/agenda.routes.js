const router = require('express').Router();
const C = require('../controllers/agenda.controller');
const validate = require('../utils/validate');
const { createActividad, updateActividad } = require('../models/agenda.model');

router.post('/', validate(createActividad), C.create);
router.get('/', C.list);
router.put('/:id', validate(updateActividad), C.update);
router.delete('/:id', C.remove);

module.exports = router;

const router = require('express').Router();
const C = require('../controllers/fotos.controller');
const validate = require('../utils/validate');
const { addFoto } = require('../models/foto.model');

router.post('/', validate(addFoto), C.add);
router.get('/post/:id_post', C.listByPost);

module.exports = router;

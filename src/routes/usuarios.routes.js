const router = require('express').Router();
const C = require('../controllers/usuarios.controller');
const F = require('../controllers/familias.controller');
const validate = require('../utils/validate');
const { createUserSchema, updateUserSchema } = require('../models/usuario.model');

//router.get('/', C.list);
router.get('/', C.searchUsers);
router.get('/familias/by-doc/search', F.searchByDocument);
router.get('/:id', C.get);
router.post('/', validate(createUserSchema), C.create);
router.put('/:id', validate(updateUserSchema), C.update);
router.delete('/:id', C.remove);


router.patch('/:id/email', C.updateEmail);

module.exports = router;

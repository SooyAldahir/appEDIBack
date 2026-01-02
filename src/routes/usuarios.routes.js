const express = require('express');
const router = express.Router();
const C = require('../controllers/usuarios.controller');
const F = require('../controllers/familias.controller');
const validate = require('../utils/validate');
const { createUserSchema, updateUserSchema } = require('../models/usuario.model');
const {authDuard} = require('../middleware/authGuard')

//router.get('/', C.list);
router.get('/', C.searchUsers);
router.get('/familias/by-doc/search', F.searchByDocument);
router.put('/update-token', C.updateToken);
router.get('/:id', C.get);
router.post('/', validate(createUserSchema), C.create);
router.put('/:id', validate(updateUserSchema), C.update);
router.delete('/:id', C.remove);


router.patch('/:id/email', C.updateEmail);

module.exports = router;

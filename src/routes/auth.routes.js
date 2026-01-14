const router = require('express').Router();
const C = require('../controllers/auth.controller');
//const validate = require('../utils/validate');
//const { loginSchema } = require('../models/auth.model');

//router.post('/login', validate(loginSchema), C.login);
router.post('/login', C.login);
router.post('/logout', C.logout);

module.exports = router;

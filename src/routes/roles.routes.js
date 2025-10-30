const r = require('express').Router();
const C = require('../controllers/roles.controller');
r.get('/', C.list);
r.post('/', C.create);
r.post('/bulk', C.bulk);
module.exports = r;

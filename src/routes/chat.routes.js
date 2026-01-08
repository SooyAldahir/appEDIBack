const router = require('express').Router();
const C = require('../controllers/chat.controller');
const auth = require('../middleware/authGuard');

// 1. Iniciar chat privado (Si no existe, lo crea)
router.post('/private', auth, C.initPrivateChat);

// 2. Crear grupo (Solo Admin debería poder, o maestros)
router.post('/group', auth, C.createGroup);

// 3. Enviar mensaje
router.post('/message', auth, C.sendMessage);

// 4. Ver mis conversaciones
router.get('/', auth, C.getMyChats);

// 5. Ver mensajes de una sala específica
router.get('/:id_sala/messages', auth, C.getMessages);

module.exports = router;
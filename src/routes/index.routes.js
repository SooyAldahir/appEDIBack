const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/usuarios', require('./usuarios.routes'));
router.use('/familias', require('./familias.routes'));
router.use('/miembros', require('./miembros.routes'));
router.use('/solicitudes', require('./solicitudes.routes'));
router.use('/publicaciones', require('./publicaciones.routes'));
router.use('/fotos', require('./fotos.routes'));
router.use('/mensajes', require('./mensajes.routes'));
router.use('/chat', require('./chat.routes'));
router.use('/agenda', require('./agenda.routes'));
router.use('/estados', require('./estados.routes'));
router.use('/provisiones', require('./provisiones.routes'));
router.use('/detalle-provision', require('./det_provisiones.routes')); 
router.use('/roles', require('./roles.routes'));
router.use('/search', require('./search.routes'));


module.exports = router;

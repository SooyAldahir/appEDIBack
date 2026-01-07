const router = require('express').Router();
const C = require('../controllers/publicaciones.controller');
const validate = require('../utils/validate');
const { createPublicacion, setEstadoPublicacion } = require('../models/publicacion.model');
const authGuard = require('../middleware/authGuard'); 
const roleGuard = require('../middleware/roleGuard');

// 👇 MOVIDO AL PRINCIPIO: Definimos los roles ANTES de usarlos
const ROLES_ACCESO_APP = [
  'Admin', 
  'PapaEDI', 
  'MamaEDI', 
  'HijoEDI', 
  'HijoSanguineo',
  'Padre', 'Madre', 'Tutor', 'Hijo', 'ALUMNO', 'Estudiante'
];

const ROLES_ADMIN = [
  'Admin',
  'PapaEDI', 
  'MamaEDI',
  'Padre',
  'Madre',
  'Tutor'
]; 

// 👇 1. ESTA RUTA DEBE IR PRIMERO (Para que no se confunda con IDs)
router.get('/mis-posts', authGuard, C.listByUsuario);

// 👇 2. Ahora sí podemos usar ROLES_ACCESO_APP porque ya existe arriba
router.post('/', authGuard, roleGuard(...ROLES_ACCESO_APP), validate(createPublicacion), C.create);

router.get('/feed/global', authGuard, C.listGlobal);

router.get('/familia/:id_familia', authGuard, C.listByFamilia);

router.get('/institucional', authGuard, roleGuard(...ROLES_ACCESO_APP), C.listInstitucional);

router.put(
  '/:id/estado', 
  authGuard, 
  roleGuard(...ROLES_ADMIN), 
  // validate(setEstadoPublicacion), // Comentado para permitir estado 'Publicado'
  C.setEstado
);

router.delete(
  '/:id', 
  authGuard, 
  C.remove
);

router.get(
  '/familia/:id_familia/pendientes', 
  authGuard, 
  roleGuard(...ROLES_ADMIN), 
  C.listPendientes
);

router.post('/:id/like', authGuard, C.toggleLike);
router.get('/:id/comentarios', authGuard, C.getComentarios);
router.post('/:id/comentarios', authGuard, C.addComentario);
router.delete('/comentarios/:id', authGuard, C.deleteComentario);

module.exports = router;
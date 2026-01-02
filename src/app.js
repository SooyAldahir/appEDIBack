const express = require('express');
const cors = require('cors');
const path = require('path'); // <-- 1. Importar 'path'
const fileUpload = require('express-fileupload'); // <-- 2. Importar paquete
const routes = require('./routes/index.routes');

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// --- 3. Configurar fileUpload ---
// Esto crea la carpeta 'public' si no existe
app.use(fileUpload({
  createParentPath: true,
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));
// ---------------------------------

app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// --- 4. Servir la carpeta 'public' ---
// Hace que http://tu-api.com/uploads/imagen.jpg funcione
app.use(express.static(path.join(__dirname, 'public')));
// -----------------------------------

// Rutas API
app.use('/api', routes);

// (El resto de tu app.js...)
app.get('/', (_req, res) => {
  res.json({
    message: 'Bienvenido a la API de EDI 301',
    rutas: [
      '/api/usuarios',
      '/api/familias',
      '/api/miembros',
      '/api/auth',
      '/api/publicaciones',
      '/api/fotos',
      '/api/agenda',
      '/api/search',
      '/api/roles',
      '/api/estados',
      '/api/solicitudes',
      '/api/provisiones',
      '/api/det-provisiones',
      '/api/mensajes'
    ]
  });
});

module.exports = app;
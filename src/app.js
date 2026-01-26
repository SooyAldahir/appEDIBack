const express = require('express');
const cors = require('cors');
const path = require('path'); 
const fileUpload = require('express-fileupload'); 
const routes = require('./routes/index.routes');

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(fileUpload({
  createParentPath: true,
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', routes);
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
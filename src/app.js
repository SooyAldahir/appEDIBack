const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => res.json({ ok: true, name: 'EDI-301 API' }));
app.use('/api', require('./routes/index.routes'));

// manejador final
app.use((err, _req, res, _next) => {
  console.error('Unhandled:', err);
  res.status(500).json({ error: 'Error inesperado' });
});

module.exports = app;

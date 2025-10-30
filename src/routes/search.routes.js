const express = require('express');
const router = express.Router();
const { sql, queryP } = require('../dataBase/dbConnection');

router.get('/', async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q) return res.json({ alumnos: [], empleados: [], familias: [] });

    const params = { q: `%${q}%` };
    const alumnos = await queryP(`
      SELECT id_usuario, nombre, apellido, tipo_usuario, matricula, num_empleado
      FROM dbo.Usuarios
      WHERE tipo_usuario = 'ALUMNO'
        AND (CAST(matricula AS NVARCHAR) LIKE @q OR nombre LIKE @q OR apellido LIKE @q)
    `, params);

    const empleados = await queryP(`
      SELECT id_usuario, nombre, apellido, tipo_usuario, matricula, num_empleado
      FROM dbo.Usuarios
      WHERE tipo_usuario = 'EMPLEADO'
        AND (CAST(num_empleado AS NVARCHAR) LIKE @q OR nombre LIKE @q OR apellido LIKE @q)
    `, params);

    const familias = await queryP(`
      SELECT id_familia, nombre_familia, residencia
      FROM dbo.Familias_EDI
      WHERE nombre_familia LIKE @q
    `, params);

    res.json({ alumnos, empleados, familias });
  } catch (err) {
    console.error('❌ search error:', err);
    res.status(500).json({ error: 'Error interno en búsqueda' });
  }
});

module.exports = router;

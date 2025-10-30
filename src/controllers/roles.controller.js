const { sql, queryP } = require('../dataBase/dbConnection');
const { ok, created, bad, fail } = require('../utils/http');

exports.list = async (_req, res) => {
  try {
    const rs = await queryP('SELECT * FROM dbo.Roles WHERE activo = 1');
    ok(res, rs);
  } catch (e) { fail(res, e); }
};

exports.create = async (req, res) => {
  try {
    const { nombre_rol, descripcion } = req.body;
    if (!nombre_rol) return bad(res, 'nombre_rol requerido');
    const rs = await queryP(`
      INSERT INTO dbo.Roles (nombre_rol, descripcion) OUTPUT INSERTED.* VALUES (@nombre_rol, @descripcion)
    `, {
      nombre_rol: { type: sql.NVarChar, value: nombre_rol },
      descripcion: { type: sql.NVarChar, value: descripcion ?? null }
    });
    created(res, rs[0]);
  } catch (e) { fail(res, e); }
};

exports.bulk = async (req, res) => {
  try {
    const { roles = [] } = req.body;
    if (!Array.isArray(roles) || roles.length === 0) return bad(res, 'roles[] requerido');
    for (const r of roles) {
      await queryP(`
        IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE nombre_rol = @nombre_rol)
          INSERT INTO dbo.Roles (nombre_rol, descripcion) VALUES (@nombre_rol, @descripcion)
      `, {
        nombre_rol: { type: sql.NVarChar, value: r.nombre_rol },
        descripcion: { type: sql.NVarChar, value: r.descripcion ?? null }
      });
    }
    ok(res, { inserted: true });
  } catch (e) { fail(res, e); }
};

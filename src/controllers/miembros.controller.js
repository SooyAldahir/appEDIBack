// controllers/miembros.controller.js
const { sql, queryP } = require('../dataBase/dbConnection');
const { ok, created, bad, fail } = require('../utils/http');

async function add(req, res) {
  try {
    const { id_familia, id_usuario, tipo_miembro } = req.body;
    const rows = await queryP(`
      INSERT INTO dbo.Miembros_Familia (id_familia, id_usuario, tipo_miembro, activo, created_at)
      OUTPUT INSERTED.id_miembro, INSERTED.id_familia, INSERTED.id_usuario, INSERTED.tipo_miembro
      VALUES (@id_familia, @id_usuario, @tipo_miembro, 1, SYSDATETIME());
    `, {
      id_familia:   { type: sql.Int, value: id_familia },
      id_usuario:   { type: sql.Int, value: id_usuario },
      tipo_miembro: { type: sql.NVarChar, value: tipo_miembro },
    });
    created(res, rows[0]);
  } catch (e) { fail(res, e); }
}

async function byFamilia(req, res) {
  try {
    const rows = await queryP(`
      SELECT mf.id_miembro, mf.id_familia, mf.id_usuario, mf.tipo_miembro
      FROM dbo.Miembros_Familia mf
      WHERE mf.id_familia = @id AND mf.activo = 1
      ORDER BY mf.tipo_miembro, mf.id_miembro DESC;
    `, { id: { type: sql.Int, value: Number(req.params.id) }});
    ok(res, rows);
  } catch (e) { fail(res, e); }
}

async function remove(req, res) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return bad(res, 'id inválido');
    await queryP(`UPDATE dbo.Miembros_Familia SET activo = 0 WHERE id_miembro = @id`,
      { id: { type: sql.Int, value: id }});
    ok(res, { message: 'Miembro desactivado' });
  } catch (e) { fail(res, e); }
}

module.exports = { add, byFamilia, remove };

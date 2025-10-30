const { sql, queryP } = require('../dataBase/dbConnection');
const { ok, created, bad, notFound, fail } = require('../utils/http');
const { Q } = require('../queries/estados.queries');

exports.create = async (req, res) => {
  try {
    const { id_usuario, tipo_estado, fecha_inicio, fecha_fin, unico_vigente = true } = req.body;
    if (!id_usuario || !tipo_estado) return bad(res, 'id_usuario y tipo_estado requeridos');

    if (unico_vigente) {
      await queryP(Q.closePrevActives, { id_usuario: { type: sql.Int, value: id_usuario } });
    }

    const rows = await queryP(Q.create, {
      id_usuario:   { type: sql.Int, value: id_usuario },
      tipo_estado:  { type: sql.NVarChar, value: tipo_estado },
      fecha_inicio: { type: sql.DateTime, value: fecha_inicio ?? null },
      fecha_fin:    { type: sql.DateTime, value: fecha_fin ?? null },
      activo:       { type: sql.Bit, value: 1 }
    });
    created(res, rows[0]);
  } catch (e) { fail(res, e); }
};

exports.listByUsuario = async (req, res) => {
  try {
    ok(res, await queryP(Q.listByUsuario, { id_usuario: { type: sql.Int, value: Number(req.params.id_usuario) } }));
  } catch (e) { fail(res, e); }
};

exports.close = async (req, res) => {
  try {
    const rows = await queryP(Q.close, { id_estado: { type: sql.Int, value: Number(req.params.id) } });
    if (!rows.length) return notFound(res);
    ok(res, rows[0]);
  } catch (e) { fail(res, e); }
};

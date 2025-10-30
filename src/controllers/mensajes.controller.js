const { sql, queryP } = require('../dataBase/dbConnection');
const { ok, created, bad, fail } = require('../utils/http');
const { Q } = require('../queries/mensajes.queries');

exports.send = async (req, res) => {
  try {
    const { id_familia, id_usuario, contenido } = req.body;
    if (!id_familia || !id_usuario || !contenido) return bad(res, 'Campos requeridos: id_familia, id_usuario, contenido');
    const rows = await queryP(Q.send, {
      id_familia: { type: sql.Int, value: id_familia },
      id_usuario: { type: sql.Int, value: id_usuario },
      contenido:  { type: sql.NVarChar, value: contenido }
    });
    created(res, rows[0]);
  } catch (e) { fail(res, e); }
};

exports.listByFamilia = async (req, res) => {
  try {
    ok(res, await queryP(Q.listByFamilia, { id_familia: { type: sql.Int, value: Number(req.params.id_familia) } }));
  } catch (e) { fail(res, e); }
};

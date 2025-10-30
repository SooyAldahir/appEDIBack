const { sql, queryP } = require('../dataBase/dbConnection');
const { ok, created, bad, fail } = require('../utils/http');
const { Q } = require('../queries/provisiones.queries');

exports.create = async (req, res) => {
  try {
    const { id_familia, fecha, cantidad_cenas, comentario } = req.body;
    if (!id_familia || !fecha || !cantidad_cenas) return bad(res, 'id_familia, fecha y cantidad_cenas requeridos');
    const rows = await queryP(Q.create, {
      id_familia:     { type: sql.Int, value: id_familia },
      fecha:          { type: sql.Date, value: fecha },
      cantidad_cenas: { type: sql.Int, value: cantidad_cenas },
      comentario:     { type: sql.NVarChar, value: comentario ?? null }
    });
    created(res, rows[0]);
  } catch (e) { fail(res, e); }
};

exports.listByFamilia = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    ok(res, await queryP(Q.listByFamilia, {
      id_familia: { type: sql.Int, value: Number(req.params.id_familia) },
      desde:      { type: sql.Date, value: desde ?? null },
      hasta:      { type: sql.Date, value: hasta ?? null }
    }));
  } catch (e) { fail(res, e); }
};

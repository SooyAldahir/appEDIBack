const { sql, queryP } = require('../dataBase/dbConnection');
const { ok, created, bad, fail } = require('../utils/http');
const { Q } = require('../queries/det_provisiones.queries');

exports.mark = async (req, res) => {
  try {
    const { id_provision, id_usuario, asistio } = req.body;
    if (!id_provision || !id_usuario || typeof asistio !== 'number') return bad(res, 'id_provision, id_usuario y asistio (0/1) requeridos');
    const rows = await queryP(Q.upsert, {
      id_provision: { type: sql.Int, value: id_provision },
      id_usuario:   { type: sql.Int, value: id_usuario },
      asistio:      { type: sql.Bit, value: asistio ? 1 : 0 }
    });
    created(res, rows[0]);
  } catch (e) { fail(res, e); }
};

exports.listByProvision = async (req, res) => {
  try {
    ok(res, await queryP(Q.listByProvision, { id_provision: { type: sql.Int, value: Number(req.params.id_provision) } }));
  } catch (e) { fail(res, e); }
};

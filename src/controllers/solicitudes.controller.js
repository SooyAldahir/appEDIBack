const { sql, queryP } = require('../dataBase/dbConnection');
const { ok, created, bad, notFound, fail } = require('../utils/http');
const { Q } = require('../queries/solicitudes.queries');

exports.create = async (req, res) => {
  try {
    const { id_familia, id_usuario, tipo_solicitud } = req.body;
    if (!id_familia || !id_usuario || !tipo_solicitud) return bad(res, 'Campos requeridos: id_familia, id_usuario, tipo_solicitud');
    const rows = await queryP(Q.create, {
      id_familia:     { type: sql.Int, value: id_familia },
      id_usuario:     { type: sql.Int, value: id_usuario },
      tipo_solicitud: { type: sql.NVarChar, value: tipo_solicitud }
    });
    created(res, rows[0]);
  } catch (e) { fail(res, e); }
};

exports.listByFamilia = async (req, res) => {
  try {
    ok(res, await queryP(Q.listByFamilia, { id_familia: { type: sql.Int, value: Number(req.params.id_familia) } }));
  } catch (e) { fail(res, e); }
};

exports.setEstado = async (req, res) => {
  try {
    const { estado } = req.body;
    if (!['Pendiente','Aceptada','Rechazada'].includes(estado)) return bad(res, 'estado inválido');
    const rows = await queryP(Q.setEstado, {
      estado:       { type: sql.NVarChar, value: estado },
      id_solicitud: { type: sql.Int, value: Number(req.params.id) }
    });
    if (!rows.length) return notFound(res);
    ok(res, rows[0]);
  } catch (e) { fail(res, e); }
};

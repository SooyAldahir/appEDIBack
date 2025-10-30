const { sql, queryP } = require('../dataBase/dbConnection');
const { ok, created, bad, notFound, fail } = require('../utils/http');
const { Q } = require('../queries/publicaciones.queries');

exports.create = async (req, res) => {
  try {
    const { id_familia, id_usuario, categoria_post, mensaje } = req.body;
    if (!id_usuario || !categoria_post) return bad(res, 'id_usuario y categoria_post requeridos');
    if (!['Familiar','Institucional'].includes(categoria_post)) return bad(res, 'categoria_post inválida');
    const rows = await queryP(Q.create, {
      id_familia:     { type: sql.Int, value: id_familia ?? null },
      id_usuario:     { type: sql.Int, value: id_usuario },
      categoria_post: { type: sql.NVarChar, value: categoria_post },
      mensaje:        { type: sql.NVarChar, value: mensaje ?? null }
    });
    created(res, rows[0]);
  } catch (e) { fail(res, e); }
};

exports.listByFamilia = async (req, res) => {
  try {
    ok(res, await queryP(Q.listByFamilia, { id_familia: { type: sql.Int, value: Number(req.params.id_familia) } }));
  } catch (e) { fail(res, e); }
};

exports.listInstitucional = async (_req, res) => {
  try { ok(res, await queryP(Q.listInstitucional)); } catch (e) { fail(res, e); }
};

exports.setEstado = async (req, res) => {
  try {
    const { estado } = req.body;
    if (!['Pendiente','Aprobada','Rechazada'].includes(estado)) return bad(res, 'estado inválido');
    const rows = await queryP(Q.setEstado, {
      estado:  { type: sql.NVarChar, value: estado },
      id_post: { type: sql.Int, value: Number(req.params.id) }
    });
    if (!rows.length) return notFound(res);
    ok(res, rows[0]);
  } catch (e) { fail(res, e); }
};

exports.remove = async (req, res) => {
  try {
    await queryP(Q.softDelete, { id_post: { type: sql.Int, value: Number(req.params.id) } });
    ok(res, { message: 'Publicación eliminada' });
  } catch (e) { fail(res, e); }
};

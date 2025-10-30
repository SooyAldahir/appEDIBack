const { sql, queryP } = require('../dataBase/dbConnection');
const { ok, created, bad, notFound, fail } = require('../utils/http');
const { Q } = require('../queries/agenda.queries');

exports.create = async (req, res) => {
  try {
    const { titulo, descripcion, fecha_evento, hora_evento, imagen, estado_publicacion } = req.body;
    if (!titulo || !fecha_evento) return bad(res, 'titulo y fecha_evento requeridos');
    const rows = await queryP(Q.create, {
      titulo: { type: sql.NVarChar, value: titulo },
      descripcion: { type: sql.NVarChar, value: descripcion ?? null },
      fecha_evento: { type: sql.Date, value: fecha_evento },
      hora_evento: { type: sql.Time, value: hora_evento ?? null },
      imagen: { type: sql.NVarChar, value: imagen ?? null },
      estado_publicacion: { type: sql.NVarChar, value: estado_publicacion ?? 'Programada' }
    });
    created(res, rows[0]);
  } catch (e) { fail(res, e); }
};

exports.list = async (req, res) => {
  try {
    const { estado, desde, hasta } = req.query;
    ok(res, await queryP(Q.list, {
      estado: { type: sql.NVarChar, value: estado ?? null },
      desde:  { type: sql.Date, value: desde ?? null },
      hasta:  { type: sql.Date, value: hasta ?? null }
    }));
  } catch (e) { fail(res, e); }
};

exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { titulo, descripcion, fecha_evento, hora_evento, imagen, estado_publicacion } = req.body;
    const rows = await queryP(Q.update, {
      id_actividad: { type: sql.Int, value: id },
      titulo: { type: sql.NVarChar, value: titulo ?? null },
      descripcion: { type: sql.NVarChar, value: descripcion ?? null },
      fecha_evento: { type: sql.Date, value: fecha_evento ?? null },
      hora_evento: { type: sql.Time, value: hora_evento ?? null },
      imagen: { type: sql.NVarChar, value: imagen ?? null },
      estado_publicacion: { type: sql.NVarChar, value: estado_publicacion ?? null }
    });
    if (!rows.length) return notFound(res);
    ok(res, rows[0]);
  } catch (e) { fail(res, e); }
};

exports.remove = async (req, res) => {
  try {
    await queryP(Q.remove, { id_actividad: { type: sql.Int, value: Number(req.params.id) } });
    ok(res, { message: 'Actividad eliminada' });
  } catch (e) { fail(res, e); }
};

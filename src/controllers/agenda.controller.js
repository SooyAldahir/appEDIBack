const { sql, queryP } = require('../dataBase/dbConnection');
const { ok, created, bad, notFound, fail } = require('../utils/http');
const { Q } = require('../queries/agenda.queries');
// 👇 1. IMPORTAR LA FUNCIÓN DE NOTIFICACIONES
const { enviarNotificacionPush } = require('../utils/firebase'); 

exports.create = async (req, res) => {
  try {
    const { titulo, descripcion, fecha_evento, hora_evento, estado_publicacion, dias_anticipacion } = req.body;

    if (!titulo || !fecha_evento) return bad(res, 'titulo y fecha_evento requeridos');

    // 👇 PROCESAR IMAGEN SI EXISTE
    let imagenUrl = null;
    if (req.files && req.files.imagen) {
      imagenUrl = await saveFile(req.files.imagen);
    }

    const rows = await queryP(Q.create, {
      titulo:             { type: sql.NVarChar, value: titulo },
      descripcion:        { type: sql.NVarChar, value: descripcion ?? null },
      fecha_evento:       { type: sql.Date,     value: fecha_evento },
      hora_evento:        { type: sql.NVarChar, value: hora_evento ?? null },
      imagen:             { type: sql.NVarChar, value: imagenUrl }, // URL del archivo
      estado_publicacion: { type: sql.NVarChar, value: estado_publicacion ?? 'Publicada' },
      dias_anticipacion:  { type: sql.Int,      value: dias_anticipacion || 3 }
    });

    created(res, rows[0]);

    // Notificaciones (Igual que antes)
    (async () => {
        try {
            const usuarios = await queryP("SELECT fcm_token FROM dbo.Usuarios WHERE fcm_token IS NOT NULL AND activo = 1");
            if (usuarios && usuarios.length > 0) {
                for (const u of usuarios) {
                    await enviarNotificacionPush(u.fcm_token, "📅 Nuevo Evento", `${titulo}`, { tipo: 'EVENTO', id_referencia: rows[0].id_actividad.toString() });
                }
            }
        } catch (e) { console.error("Error notificaciones:", e); }
    })();

  } catch (e) { console.error(e); if (!res.headersSent) fail(res, e); }
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

const saveFile = (file) => {
  if (!file) return null;
  const ext = path.extname(file.name);
  const fileName = `evento-${Date.now()}${ext}`;
  const uploadPath = path.join(__dirname, '..', 'public', 'uploads', fileName);
  
  return new Promise((resolve, reject) => {
    file.mv(uploadPath, (err) => {
      if (err) reject(err);
      else resolve(`/uploads/${fileName}`);
    });
  });
};

exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { titulo, descripcion, fecha_evento, hora_evento, estado_publicacion, dias_anticipacion } = req.body;

    // 👇 PROCESAR IMAGEN NUEVA
    let imagenUrl = null;
    if (req.files && req.files.imagen) {
      imagenUrl = await saveFile(req.files.imagen);
    }

    const rows = await queryP(Q.update, {
      id_actividad:       { type: sql.Int,      value: id },
      titulo:             { type: sql.NVarChar, value: titulo },
      descripcion:        { type: sql.NVarChar, value: descripcion },
      fecha_evento:       { type: sql.Date,     value: fecha_evento },
      hora_evento:        { type: sql.NVarChar, value: hora_evento ?? null },
      imagen:             { type: sql.NVarChar, value: imagenUrl }, // Si es null, SQL mantiene la anterior
      estado_publicacion: { type: sql.NVarChar, value: estado_publicacion ?? null },
      dias_anticipacion:  { type: sql.Int,      value: dias_anticipacion ?? null }
    });

    if (!rows || !rows.length) return notFound(res, 'No se pudo actualizar');
    ok(res, rows[0]);

  } catch (e) { console.error(e); fail(res, e); }
};

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await queryP(Q.remove, { id_actividad: { type: sql.Int, value: id } });
    ok(res, { message: 'Evento eliminado' });
  } catch (e) { fail(res, e); }
};
const { sql, queryP } = require('../dataBase/dbConnection');
const { ok, created, bad, notFound, fail } = require('../utils/http');
const { Q } = require('../queries/agenda.queries');
// 👇 1. IMPORTAR LA FUNCIÓN DE NOTIFICACIONES
const { enviarNotificacionPush } = require('../utils/firebase'); 

exports.create = async (req, res) => {
  try {
    const { 
        titulo, descripcion, fecha_evento, hora_evento, imagen, estado_publicacion,
        dias_anticipacion 
    } = req.body;

    if (!titulo || !fecha_evento) return bad(res, 'titulo y fecha_evento requeridos');

    // 1. Guardar en BD
    const rows = await queryP(Q.create, {
      titulo:             { type: sql.NVarChar, value: titulo },
      descripcion:        { type: sql.NVarChar, value: descripcion ?? null },
      fecha_evento:       { type: sql.Date,     value: fecha_evento },
      hora_evento:        { type: sql.NVarChar, value: hora_evento ?? null },
      imagen:             { type: sql.NVarChar, value: imagen ?? null },
      estado_publicacion: { type: sql.NVarChar, value: estado_publicacion ?? 'Publicada' },
      dias_anticipacion:  { type: sql.Int,      value: dias_anticipacion || 3 }
    });

    // 2. Responder al cliente PRIMERO (para que la app no se quede cargando)
    created(res, rows[0]);

    // 3. ENVIAR NOTIFICACIONES (En segundo plano)
    // Usamos un bloque try-catch independiente para que si falla no rompa la respuesta anterior
    (async () => {
        try {
            // 👇 Usamos queryP en lugar de getConnection
            const usuarios = await queryP("SELECT fcm_token FROM dbo.Usuarios WHERE fcm_token IS NOT NULL AND activo = 1");
            
            // Verificamos si hay usuarios
            if (usuarios && usuarios.length > 0) {
                console.log(`📢 Enviando notificación de evento a ${usuarios.length} usuarios...`);
                
                // Enviamos una por una (o podrías usar un envío masivo si tu función lo soporta)
                for (const u of usuarios) {
                    await enviarNotificacionPush(
                        u.fcm_token, 
                        "📅 Nuevo Evento Escolar", 
                        `${titulo}`,
                        { tipo: 'EVENTO', id_referencia: rows[0].id_actividad.toString() }
                    );
                }
            }
        } catch (notifError) {
            console.error("⚠️ Error enviando notificaciones de agenda:", notifError);
            // No hacemos fail(res) aquí porque ya respondimos arriba
        }
    })();

  } catch (e) { 
      // Este catch solo captura errores ANTES del created(res)
      console.error(e);
      if (!res.headersSent) fail(res, e); 
  }
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
      hora_evento: { type: sql.NVarChar, value: hora_evento ?? null },
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
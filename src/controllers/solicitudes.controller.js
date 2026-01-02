const { sql, queryP, getConnection } = require('../dataBase/dbConnection'); // Importante: getConnection
const { ok, created, bad, notFound, fail } = require('../utils/http');
const { Q } = require('../queries/solicitudes.queries');
const { Q: QU } = require('../queries/usuarios.queries'); // Importamos queries de usuario
const { enviarNotificacionPush } = require('../utils/firebase'); // Tu utilidad de Firebase

exports.create = async (req, res) => {
  try {
    const { id_familia, id_usuario, tipo_solicitud } = req.body;
    
    // 1. Validaciones
    if (!id_familia || !id_usuario || !tipo_solicitud) {
        return bad(res, 'Campos requeridos: id_familia, id_usuario, tipo_solicitud');
    }

    // 2. Guardar la solicitud en SQL (Tu código original)
    const rows = await queryP(Q.create, {
      id_familia:     { type: sql.Int, value: id_familia },
      id_usuario:     { type: sql.Int, value: id_usuario },
      tipo_solicitud: { type: sql.NVarChar, value: tipo_solicitud }
    });

    const nuevaSolicitud = rows[0];

    // =========================================================================
    // 3. LÓGICA DE NOTIFICACIÓN (¡Esto es lo que faltaba!)
    // =========================================================================
    if (nuevaSolicitud) {
        try {
            const pool = await getConnection();

            // A. Buscar a los padres/tutores de esa familia
            const padresResult = await pool.request()
                .input('id_familia', sql.Int, id_familia)
                .query(QU.getTokensPadresPorFamilia);

            const padres = padresResult.recordset;

            console.log(`👨‍👩‍👧 Se encontraron ${padres.length} padres para notificar.`);

            // B. Enviar notificación a cada padre encontrado
            for (const padre of padres) {
                // Guardar en Historial (Campanita)
                await pool.request()
                    .input('id_usuario_destino', sql.Int, padre.id_usuario)
                    .input('titulo', sql.NVarChar, 'Nueva Solicitud')
                    .input('cuerpo', sql.NVarChar, 'Un miembro de tu familia solicita aprobación.')
                    .input('tipo', sql.NVarChar, 'SOLICITUD')
                    .input('id_referencia', sql.Int, nuevaSolicitud.id_solicitud) // Ajusta el nombre del ID si varía
                    .query(QU.createNotificacion);
console.log("🧐 TOKEN A ENVIAR:", padre.session_token);
                // Enviar Push al celular
                if (padre.session_token) {
                     await enviarNotificacionPush(
                        padre.session_token,
                        "Nueva Solicitud Familiar 📩",
                        "Tu hijo ha enviado una solicitud pendiente de aprobación.",
                        { 
                            tipo: 'SOLICITUD', 
                            id_solicitud: nuevaSolicitud.id_solicitud ? nuevaSolicitud.id_solicitud.toString() : '0' 
                        }
                    );
                }
            }
        } catch (notifError) {
            console.error("⚠️ Error enviando notificaciones (La solicitud sí se creó):", notifError);
            // No hacemos fail(res) aquí para no cancelar la creación de la solicitud si falla el push
        }
    }
    // =========================================================================

    created(res, nuevaSolicitud);

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
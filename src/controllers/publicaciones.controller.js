const { sql, queryP } = require('../dataBase/dbConnection');
const { ok, created, bad, notFound, fail } = require('../utils/http');
const { Q } = require('../queries/publicaciones.queries');
const path = require('path');
const { enviarNotificacionPush } = require('../utils/firebase'); 

exports.create = async (req, res) => {
  try {
    const { id_familia, categoria_post, mensaje, tipo } = req.body; // Recibimos 'tipo' (POST o STORY)
    
    // ---------------------------------------------------------
    // 1. Manejo de Imagen (Igual que antes)
    // ---------------------------------------------------------
    
    let url_imagen = null;

    const id_usuario = req.user.id_usuario ?? req.user.id ?? req.user.userId;

    if (req.files && req.files.imagen) {
      const archivo = req.files.imagen; // 'imagen' es la llave que envía Flutter
      const extension = path.extname(archivo.name);
      const nombreArchivo = `${Date.now()}-${Math.round(Math.random() * 1E9)}${extension}`;
      
      // Ruta donde se guardará el archivo físico
      const uploadPath = path.join(__dirname, '../public/uploads', nombreArchivo);
      
      // Movemos el archivo a esa carpeta
      await archivo.mv(uploadPath);
      
      // Guardamos la URL pública para la BD
      url_imagen = `/uploads/${nombreArchivo}`;
    }

    if (!id_usuario || !categoria_post) return bad(res, 'Faltan datos requeridos');

    // ---------------------------------------------------------
    // 2. "EL FILTRO": Determinar si necesita aprobación
    // ---------------------------------------------------------
    // Consultamos el rol del usuario que está publicando
    const userRows = await queryP(Q.getUserRole, { id_usuario: { type: sql.Int, value: id_usuario }});
    if (!userRows.length) return bad(res, 'Usuario no encontrado');
    
    const usuario = userRows[0];
    const rol = (usuario.nombre_rol || '').toString();

    // Definimos quiénes tienen "Pase VIP" para publicar sin permiso
    const rolesAutoridad = ['Admin', 'PapaEDI', 'MamaEDI', 'Padre', 'Madre', 'Tutor'];

    // Verificamos si el rol del usuario es una autoridad
    const esAutoridad = rolesAutoridad.some(r => rol.includes(r));

    // Si es autoridad -> 'Publicado'. Si no -> 'Pendiente'.
    const estadoInicial = esAutoridad ? 'Publicado' : 'Pendiente';
    
    const tipoFinal = tipo || 'POST'; 

    // ---------------------------------------------------------
    // 3. Guardar en Base de Datos
    // ---------------------------------------------------------
    const rows = await queryP(Q.create, {
      id_familia:     { type: sql.Int, value: id_familia ? Number(id_familia) : null },
      id_usuario:     { type: sql.Int, value: id_usuario },
      categoria_post: { type: sql.NVarChar, value: categoria_post },
      mensaje:        { type: sql.NVarChar, value: mensaje ?? null },
      url_imagen:     { type: sql.NVarChar, value: url_imagen },
      estado:         { type: sql.NVarChar, value: estadoInicial }, // <--- Usamos la nueva variable
      tipo:           { type: sql.NVarChar, value: tipoFinal }
    });
    
    const post = rows[0];

    // ---------------------------------------------------------
    // 4. Notificar a los Padres (Si quedó pendiente)
    // ---------------------------------------------------------
    if (estadoInicial === 'Pendiente' && id_familia) {
        console.log(`🔒 Publicación pendiente creada por ${usuario.nombre}. Notificando padres...`);
        
        // Buscamos los tokens de los padres de esa familia
        const padres = await queryP(Q.getTokensPadres, { id_familia: { type: sql.Int, value: id_familia }});
        
        for (const padre of padres) {
            if (padre.fcm_token) {
                // Enviamos la alerta
                await enviarNotificacionPush(
                    padre.fcm_token,
                    'Solicitud de Publicación 📝',
                    `${usuario.nombre} quiere subir un ${tipoFinal === 'STORY' ? 'historia' : 'post'}. Toca para revisar.`,
                    { 
                        tipo: 'SOLICITUD', 
                        id_referencia: post.id_post.toString() 
                    }
                );
            }
        }
    } else {
        console.log(`✅ Publicación creada directamente por ${rol} (${usuario.nombre})`);
    }

    created(res, post);
  } catch (e) { 
    console.error(e);
    fail(res, e); 
  }
};

// ... Tus otras funciones (listByFamilia, setEstado, etc.) déjalas igual ...
// Solo asegúrate de copiar el resto del archivo original aquí abajo.
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
    const idPost = Number(req.params.id);

    // 1. Validamos estado
    if (!['Pendiente', 'Aprobada', 'Rechazada', 'Publicado'].includes(estado)) {
        return bad(res, 'estado inválido');
    }

    // 2. BUSCAMOS INFORMACIÓN DEL DUEÑO DEL POST (Antes de actualizar)
    // Hacemos un JOIN para obtener el token del usuario directamente
    const postInfo = await queryP(`
        SELECT p.id_usuario, u.fcm_token, u.nombre 
        FROM dbo.Publicaciones p
        JOIN dbo.Usuarios u ON u.id_usuario = p.id_usuario
        WHERE p.id_post = @id_post
    `, { id_post: { type: sql.Int, value: idPost } });

    if (!postInfo.length) return notFound(res, 'Publicación no encontrada');
    const { fcm_token, nombre } = postInfo[0];

    // 3. ACTUALIZAMOS EL ESTADO
    const rows = await queryP(Q.setEstado, {
      estado:  { type: sql.NVarChar, value: estado },
      id_post: { type: sql.Int, value: idPost }
    });
    
    // 4. ENVIAMOS LA NOTIFICACIÓN AL ALUMNO
    if (fcm_token) {
        let titulo = '';
        let cuerpo = '';

        if (estado === 'Publicado' || estado === 'Aprobada') {
            titulo = '¡Publicación Aprobada! 🎉';
            cuerpo = 'Tu publicación ya está visible para la familia.';
        } else if (estado === 'Rechazada') {
            titulo = 'Publicación Rechazada 👮‍♂️';
            cuerpo = 'Tu padre/tutor ha rechazado tu solicitud.';
        }

        if (titulo) {
            console.log(`🔔 Notificando a ${nombre} sobre su post...`);
            await enviarNotificacionPush(fcm_token, titulo, cuerpo, { 
                tipo: 'ESTADO_POST', 
                id_referencia: idPost.toString() 
            });
        }
    }

    ok(res, rows[0]);
  } catch (e) { fail(res, e); }
};

exports.remove = async (req, res) => {
  try {
    await queryP(Q.softDelete, { id_post: { type: sql.Int, value: Number(req.params.id) } });
    ok(res, { message: 'Publicación eliminada' });
  } catch (e) { fail(res, e); }
};

exports.listPendientes = async (req, res) => {
  try {
    const rows = await queryP(Q.listPendientesPorFamilia, { 
      id_familia: { type: sql.Int, value: Number(req.params.id_familia) } 
    });
    ok(res, rows);
  } catch (e) { fail(res, e); }
};


exports.listByUsuario = async (req, res) => {
  try {
    console.log("🔍 Intentando listar mis posts. Token descifrado:", req.user);

    // Usamos ?? para permitir el 0
    const id_usuario = req.user.id_usuario ?? req.user.id ?? req.user.userId;
    console.log(`🆔 ID extraído: ${id_usuario}`);

    if (id_usuario === undefined || id_usuario === null) {
        return bad(res, 'ID de usuario no encontrado en token');
    }

    const rows = await queryP(Q.listByUsuario, { 
        id_usuario: { type: sql.Int, value: id_usuario } 
    });
    
    // 👇 CORRECCIÓN DE SEGURIDAD:
    // Si rows es null o undefined, lo convertimos en array vacío []
    const resultados = rows || []; 

    console.log(`📊 Encontrados: ${resultados.length} posts`);
    ok(res, resultados);

  } catch (e) { 
    console.error("💥 Error en listByUsuario:", e);
    fail(res, e); 
  }
};
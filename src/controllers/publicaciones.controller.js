const { sql, queryP } = require('../dataBase/dbConnection');
const { ok, created, bad, notFound, fail } = require('../utils/http');
const { Q } = require('../queries/publicaciones.queries');
const path = require('path');
const { enviarNotificacionPush } = require('../utils/firebase'); 
const { Q: AgendaQ } = require('../queries/agenda.queries');

exports.create = async (req, res) => {
  try {
    const { id_familia, categoria_post, mensaje, tipo } = req.body; 
    
    let url_imagen = null;

    const id_usuario = req.user.id_usuario ?? req.user.id ?? req.user.userId;

    if (req.files && req.files.imagen) {
      const archivo = req.files.imagen; 
      const extension = path.extname(archivo.name);
      const nombreArchivo = `${Date.now()}-${Math.round(Math.random() * 1E9)}${extension}`;
      const uploadPath = path.join(__dirname, '../public/uploads', nombreArchivo);
    
      await archivo.mv(uploadPath);
    
      url_imagen = `/uploads/${nombreArchivo}`;
    }

    if (!id_usuario || !categoria_post) return bad(res, 'Faltan datos requeridos');

    const userRows = await queryP(Q.getUserRole, { id_usuario: { type: sql.Int, value: id_usuario }});
    if (!userRows.length) return bad(res, 'Usuario no encontrado');
    
    const usuario = userRows[0];
    const rol = (usuario.nombre_rol || '').toString();
    const rolesAutoridad = ['Admin', 'PapaEDI', 'MamaEDI', 'Padre', 'Madre', 'Tutor'];
    const esAutoridad = rolesAutoridad.some(r => rol.includes(r));
    const estadoInicial = esAutoridad ? 'Publicado' : 'Pendiente';
    const tipoFinal = tipo || 'POST'; 
    const rows = await queryP(Q.create, {
      id_familia:     { type: sql.Int, value: id_familia ? Number(id_familia) : null },
      id_usuario:     { type: sql.Int, value: id_usuario },
      categoria_post: { type: sql.NVarChar, value: categoria_post },
      mensaje:        { type: sql.NVarChar, value: mensaje ?? null },
      url_imagen:     { type: sql.NVarChar, value: url_imagen },
      estado:         { type: sql.NVarChar, value: estadoInicial }, 
      tipo:           { type: sql.NVarChar, value: tipoFinal }
    });
    
    const post = rows[0];
    if (estadoInicial === 'Pendiente' && id_familia) {
        console.log(`🔒 Publicación pendiente creada por ${usuario.nombre}. Notificando padres...`);
      
        const padres = await queryP(Q.getTokensPadres, { id_familia: { type: sql.Int, value: id_familia }});
        
        for (const padre of padres) {
            if (padre.fcm_token) {
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
        console.log(`Publicación creada directamente por ${rol} (${usuario.nombre})`);
    }

    created(res, post);
  } catch (e) { 
    console.error(e);
    fail(res, e); 
  }
};

exports.listByFamilia = async (req, res) => {
  try {
    const idUsuarioActual = req.user.id_usuario ?? req.user.id; 
    const rows = await queryP(Q.listByFamilia, { 
        id_familia: { type: sql.Int, value: Number(req.params.id_familia) },
        current_user_id: { type: sql.Int, value: idUsuarioActual } 
    });
    ok(res, rows);
  } catch (e) { fail(res, e); }
};

exports.listInstitucional = async (_req, res) => {
  try { ok(res, await queryP(Q.listInstitucional)); } catch (e) { fail(res, e); }
};

exports.setEstado = async (req, res) => {
  try {
    const { estado } = req.body;
    const idPost = Number(req.params.id);

    if (!['Pendiente', 'Aprobada', 'Rechazada', 'Publicado'].includes(estado)) {
        return bad(res, 'estado inválido');
    }

    const postInfo = await queryP(`
        SELECT p.id_usuario, u.fcm_token, u.nombre 
        FROM dbo.Publicaciones p
        JOIN dbo.Usuarios u ON u.id_usuario = p.id_usuario
        WHERE p.id_post = @id_post
    `, { id_post: { type: sql.Int, value: idPost } });

    if (!postInfo.length) return notFound(res, 'Publicación no encontrada');
    const { fcm_token, nombre } = postInfo[0];
    const rows = await queryP(Q.setEstado, {
      estado:  { type: sql.NVarChar, value: estado },
      id_post: { type: sql.Int, value: idPost }
    });
    
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
    
    const resultados = rows || []; 

    console.log(`📊 Encontrados: ${resultados.length} posts`);
    ok(res, resultados);

  } catch (e) { 
    console.error("💥 Error en listByUsuario:", e);
    fail(res, e); 
  }
};

exports.toggleLike = async (req, res) => {
    try {
        const id_post = Number(req.params.id);
        const id_usuario = req.user.id_usuario ?? req.user.id;
        
        const result = await queryP(Q.toggleLike, {
            id_post: { type: sql.Int, value: id_post },
            id_usuario: { type: sql.Int, value: id_usuario }
        });
        
        ok(res, result[0]); 
    } catch (e) { fail(res, e); }
};

exports.addComentario = async (req, res) => {
    try {
        const id_post = Number(req.params.id);
        const id_usuario = req.user.id_usuario ?? req.user.id;
        const { contenido } = req.body;

        if (!contenido) return bad(res, 'Contenido requerido');

        await queryP(Q.addComentario, {
            id_post: { type: sql.Int, value: id_post },
            id_usuario: { type: sql.Int, value: id_usuario },
            contenido: { type: sql.NVarChar, value: contenido }
        });

        created(res, { message: 'Comentario agregado' });
    } catch (e) { fail(res, e); }
};

exports.getComentarios = async (req, res) => {
    try {
        const id_post = Number(req.params.id);
        const rows = await queryP(Q.getComentarios, {
            id_post: { type: sql.Int, value: id_post }
        });
        ok(res, rows);
    } catch (e) { fail(res, e); }
};


exports.deleteComentario = async (req, res) => {
  try {
    const idComentario = Number(req.params.id);
    const idUsuarioSolicitante = req.user.id_usuario ?? req.user.id;
    const commentCheck = await queryP(
      'SELECT id_usuario FROM Publicaciones_Comentarios WHERE id_comentario = @id', 
      { id: { type: sql.Int, value: idComentario } }
    );

    if (!commentCheck.length) return notFound(res, 'Comentario no encontrado');

    const idDueno = commentCheck[0].id_usuario;
    const esAdmin = ['Admin', 'PapaEDI', 'MamaEDI'].some(r => (req.user.nombre_rol || req.user.rol || '').includes(r));
    if (idDueno !== idUsuarioSolicitante && !esAdmin) {
        return res.status(403).json({ message: 'No puedes borrar este comentario' });
    }
    await queryP(
      'UPDATE Publicaciones_Comentarios SET activo = 0 WHERE id_comentario = @id', 
      { id: { type: sql.Int, value: idComentario } }
    );

    ok(res, { message: 'Comentario eliminado' });

  } catch (e) { fail(res, e); }
};

exports.listGlobal = async (req, res) => {
  try {
    const idUsuarioActual = req.user.id_usuario ?? req.user.id;
    const posts = await queryP(Q.listGlobal, { 
        current_user_id: { type: sql.Int, value: idUsuarioActual } 
    });
    const eventos = await queryP(AgendaQ.getActiveEvents);
    const feed = [...(eventos || []), ...(posts || [])];
    
    ok(res, feed);
  } catch (e) { fail(res, e); }
};
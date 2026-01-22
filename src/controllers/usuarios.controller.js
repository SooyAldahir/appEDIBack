const { sql, queryP, getConnection } = require('../dataBase/dbConnection');
const { createUserSchema, updateUserSchema } = require('../models/usuario.model');
const { hashPassword } = require('../utils/hash');
const { ok, created, bad, fail, notFound } = require('../utils/http');
const UQ = require('../queries/usuarios.queries').Q;
const { Q } = require('../queries/usuarios.queries');
const path = require('path'); // 👈 1. IMPORTANTE: Necesario para manejar rutas de archivos

exports.create = async (req, res) => {
  try {
    const { error, value } = createUserSchema.validate(req.body);
    if (error) return bad(res, 'Datos inválidos');

    const hashed = await hashPassword(value.contrasena);

    const params = {
      nombre:         { type: sql.NVarChar, value: value.nombre },
      apellido:       { type: sql.NVarChar, value: value.apellido ?? null },
      correo:         { type: sql.NVarChar, value: value.correo },
      contrasena:     { type: sql.NVarChar, value: hashed },
      foto_perfil:    { type: sql.NVarChar, value: value.foto_perfil ?? null },
      tipo_usuario:   { type: sql.NVarChar, value: value.tipo_usuario },
      matricula:      { type: sql.Int,      value: value.matricula ?? null },
      num_empleado:   { type: sql.Int,      value: value.num_empleado ?? null },
      id_rol:         { type: sql.Int,      value: value.id_rol },
      telefono:       { type: sql.NVarChar, value: value.telefono ?? null },
      residencia:     { type: sql.NVarChar, value: value.residencia ?? null },
      direccion:      { type: sql.NVarChar, value: value.direccion ?? null },
      fecha_nacimiento:{ type: sql.Date,    value: value.fecha_nacimiento ?? null },
      carrera:        { type: sql.NVarChar, value: value.carrera ?? null },
    };

    const rows = await queryP(UQ.insert, params);
    const user = rows[0]; 
    delete user.contrasena;

    // 👇 LÓGICA AUTO-CHAT PADRES (Mantenida intacta)
    try {
        const newUserId = user.id_usuario || user.IdUsuario; 
        if (newUserId) {
            const autoChatQuery = `
                DECLARE @RoleName nvarchar(50) = (SELECT nombre_rol FROM dbo.Roles WHERE id_rol = @idRol);
                IF @RoleName IN ('Padre', 'Madre', 'Tutor', 'PapaEDI', 'MamaEDI')
                BEGIN
                    DECLARE @IdSala int = (SELECT TOP 1 id_sala FROM dbo.Chat_Salas WHERE nombre = 'Comunidad de Padres');
                    IF @IdSala IS NOT NULL
                    BEGIN
                        INSERT INTO dbo.Chat_Participantes (id_sala, id_usuario, es_admin)
                        VALUES (@IdSala, @idUsuario, 0); 
                    END
                END
            `;
            await queryP(autoChatQuery, {
                idRol: { type: sql.Int, value: value.id_rol },
                idUsuario: { type: sql.Int, value: newUserId }
            });
            console.log(`✅ Verificación de chat completada para usuario ${newUserId}`);
        }
    } catch (chatError) {
        console.error("⚠️ Error agregando usuario al chat automático:", chatError);
    }

    created(res, user);
  } catch (e) {
    fail(res, e);
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const tipo = (req.query.tipo || '').toUpperCase();
    const q = (req.query.q || '').trim();

    if (!['ALUMNO', 'EMPLEADO'].includes(tipo)) {
      return res.json([]);
    }

    const isNumeric = /^\d+$/.test(q);
    const like = `%${q}%`;

    const baseSelect = `
      SELECT
        u.id_usuario      AS IdUsuario,
        u.nombre          AS Nombre,
        u.apellido        AS Apellido,
        u.tipo_usuario    AS TipoUsuario,
        u.matricula       AS Matricula,
        u.num_empleado    AS NumEmpleado,
        u.correo          AS E_mail
      FROM dbo.Usuarios u
      WHERE u.tipo_usuario = @tipo
    `;

    let sqlText = '';
    const params = {
      tipo: { type: sql.NVarChar, value: tipo },
      like: { type: sql.NVarChar, value: like },
    };

    if (isNumeric) {
      if (tipo === 'ALUMNO') {
        sqlText = `${baseSelect} AND CAST(u.matricula AS NVARCHAR(50)) LIKE @like ORDER BY u.nombre, u.apellido`;
      } else {
        sqlText = `${baseSelect} AND CAST(u.num_empleado AS NVARCHAR(50)) LIKE @like ORDER BY u.nombre, u.apellido`;
      }
    } else {
      sqlText = `${baseSelect} AND (u.nombre LIKE @like OR u.apellido LIKE @like) ORDER BY u.nombre, u.apellido`;
    }

    const rows = await queryP(sqlText, params);
    res.json(rows);
  } catch (e) {
    console.error('searchUsers', e);
    res.status(500).json([]);
  }
};

// 🔥 [MODIFICADO] Función UPDATE ahora acepta IMÁGENES
exports.update = async (req, res) => {
  try {
    // 1. Manejo de archivo (Si se envía una foto)
    let rutaFoto = null;
    
    // 'foto' es el nombre del campo que enviaremos desde Flutter
    if (req.files && req.files.foto) {
      const archivo = req.files.foto;
      const extension = path.extname(archivo.name);
      // Creamos un nombre único: perfil-ID-timestamp.jpg
      const nombreArchivo = `perfil-${req.params.id}-${Date.now()}${extension}`;
      
      const uploadPath = path.join(__dirname, '../public/uploads', nombreArchivo);
      
      // Guardamos el archivo físico en la carpeta uploads
      await archivo.mv(uploadPath);
      rutaFoto = `/uploads/${nombreArchivo}`;
    }

    // 2. Validación de datos (allowUnknown: true permite campos extra como 'foto')
    const { error, value } = updateUserSchema
      .prefs({ abortEarly: false, allowUnknown: true })
      .validate(req.body);

    if (error) return bad(res, 'Datos inválidos: ' + error.message);

    // Helper para nulos
    const nn = (v) => (v === undefined || v === null || (typeof v === 'string' && v.trim() === '')) ? null : v;

    // Manejo de fecha
    let fechaDate = null;
    if (value.fecha_nacimiento) {
      let iso = String(value.fecha_nacimiento).trim();
      const m = iso.match(/^(\d{2})-(\d{2})-(\d{4})$/);
      if (m) iso = `${m[3]}-${m[2]}-${m[1]}`;
      const d = new Date(iso);
      if (!isNaN(d.getTime())) fechaDate = d;
    }

    // 3. Decidir qué foto usar: la nueva (si se subió) o la que venga en el body (texto)
    const fotoFinal = rutaFoto ? rutaFoto : nn(value.foto_perfil);

    const params = {
      id_usuario:       { type: sql.Int,      value: Number(req.params.id) },
      nombre:           { type: sql.NVarChar, value: nn(value.nombre) },
      apellido:         { type: sql.NVarChar, value: nn(value.apellido) },
      
      foto_perfil:      { type: sql.NVarChar, value: fotoFinal }, // 👈 AQUÍ ACTUALIZAMOS LA FOTO
      
      estado:           { type: sql.NVarChar, value: nn(value.estado) },
      activo:           { type: sql.Bit,      value: value.activo === undefined ? null : (value.activo ? 1 : 0) },
      telefono:         { type: sql.NVarChar, value: nn(value.telefono) },
      residencia:       { type: sql.NVarChar, value: nn(value.residencia) },
      direccion:        { type: sql.NVarChar, value: nn(value.direccion) },
      fecha_nacimiento: { type: sql.Date,     value: fechaDate },
      carrera:          { type: sql.NVarChar, value: nn(value.carrera) },
    };

    const rows = await queryP(UQ.updateBasic, params);
    if (!rows.length) return notFound(res);

    const user = rows[0];
    delete user.contrasena;
    ok(res, user);
  } catch (e) {
    console.error('usuarios.update error:', e?.originalError?.info?.message || e);
    fail(res, e);
  }
};

exports.list = async (_req, res) => {
  try { ok(res, await queryP(UQ.list)); } catch (e) { fail(res, e); }
};

exports.get = async (req, res) => {
  try {
    const rows = await queryP(UQ.byId, { id_usuario: { type: sql.Int, value: Number(req.params.id) } });
    if (!rows.length) return notFound(res);
    const user = rows[0]; delete user.contrasena;
    ok(res, user);
  } catch (e) { fail(res, e); }
};

exports.remove = async (req, res) => {
  try {
    await queryP(UQ.softDelete, { id_usuario: { type: sql.Int, value: Number(req.params.id) } });
    ok(res, { message: 'Usuario desactivado' });
  } catch (e) { fail(res, e); }
};

exports.updateEmail = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { correo } = req.body || {};
    if (!Number.isInteger(id) || id <= 0) return bad(res, 'Id inválido');
    if (!correo || typeof correo !== 'string' || !/^\S+@\S+\.\S+$/.test(correo)) {
      return bad(res, 'Correo inválido');
    }

    const dup = await queryP(`
      SELECT 1 FROM dbo.Usuarios WHERE correo = @correo AND id_usuario <> @id
    `, { correo: { type: sql.NVarChar, value: correo }, id: { type: sql.Int, value: id } });
    if (dup.length) return bad(res, 'El correo ya está en uso');

    const rows = await queryP(`
      UPDATE dbo.Usuarios
      SET correo = @correo, updated_at = GETDATE()
      OUTPUT INSERTED.id_usuario      AS IdUsuario,
             INSERTED.nombre          AS Nombre,
             INSERTED.apellido        AS Apellido,
             INSERTED.tipo_usuario    AS TipoUsuario,
             INSERTED.matricula       AS Matricula,
             INSERTED.num_empleado    AS NumEmpleado,
             INSERTED.correo          AS E_mail,
             INSERTED.estado          AS Estado
      WHERE id_usuario = @id
    `, { correo: { type: sql.NVarChar, value: correo }, id: { type: sql.Int, value: id } });

    if (!rows.length) return notFound(res);
    ok(res, rows[0]);
  } catch (e) { fail(res, e); }
};

exports.updateToken = async (req, res) => {
    try {
        const { id_usuario, session_token } = req.body;
        
        if (!id_usuario || !session_token) {
            return res.status(400).json({ msg: "Faltan datos (id_usuario o token)" });
        }

        const pool = await getConnection();
        await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('token', sql.NVarChar, session_token)
            .query(Q.updateFcm);

        res.json({ msg: "Token actualizado correctamente" });
    } catch (error) {
        console.error("Error actualizando token:", error);
        res.status(500).json({ msg: "Error interno" });
    }
};

exports.getBirthdays = async (req, res) => {
  try {
    // Usamos la query que acabamos de crear
    const rows = await queryP(Q.birthdaysToday);
    ok(res, rows);
  } catch (e) {
    fail(res, e);
  }
};
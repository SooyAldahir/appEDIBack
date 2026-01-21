const { sql, queryP, pool } = require('../dataBase/dbConnection');
const { ok, created, bad, fail } = require('../utils/http');
const { enviarNotificacionPush, enviarNotificacionMulticast } = require('../utils/firebase');

async function add(req, res) {
  try {
    const { id_familia, id_usuario, tipo_miembro } = req.body;
    const rows = await queryP(`
      INSERT INTO dbo.Miembros_Familia (id_familia, id_usuario, tipo_miembro, activo, created_at)
      OUTPUT INSERTED.id_miembro, INSERTED.id_familia, INSERTED.id_usuario, INSERTED.tipo_miembro
      VALUES (@id_familia, @id_usuario, @tipo_miembro, 1, SYSDATETIME());
    `, {
      id_familia:   { type: sql.Int, value: id_familia },
      id_usuario:   { type: sql.Int, value: id_usuario },
      tipo_miembro: { type: sql.NVarChar, value: tipo_miembro },
    });
    created(res, rows[0]);
  } catch (e) { fail(res, e); }
}

async function byFamilia(req, res) {
  try {
    const rows = await queryP(`
      SELECT mf.id_miembro, mf.id_familia, mf.id_usuario, mf.tipo_miembro
      FROM dbo.Miembros_Familia mf
      WHERE mf.id_familia = @id AND mf.activo = 1
      ORDER BY mf.tipo_miembro, mf.id_miembro DESC;
    `, { id: { type: sql.Int, value: Number(req.params.id) }});
    ok(res, rows);
  } catch (e) { fail(res, e); }
}

async function remove(req, res) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return bad(res, 'id inválido');
    
    // Eliminación física (Hard Delete) para permitir reasignación
    await queryP(`DELETE FROM dbo.Miembros_Familia WHERE id_miembro = @id`,
      { id: { type: sql.Int, value: id }});
    ok(res, { message: 'Miembro eliminado permanentemente de la familia' });
  } catch (e) { fail(res, e); }
}

async function addBulk(req, res) {
  // Lógica simple sin notificaciones (opcional)
  const transaction = new sql.Transaction(pool); 
  try {
    const { id_familia, id_usuarios } = req.body;
    await transaction.begin();
    for (const id_usuario of id_usuarios) {
      const request = new sql.Request(transaction);
      request.input('id_familia', sql.Int, id_familia);
      request.input('id_usuario', sql.Int, id_usuario);
      request.input('tipo_miembro', sql.NVarChar, 'ALUMNO_ASIGNADO');
      await request.query(`INSERT INTO dbo.Miembros_Familia (id_familia, id_usuario, tipo_miembro) VALUES (@id_familia, @id_usuario, @tipo_miembro)`);
    }
    await transaction.commit();
    ok(res, { message: `${id_usuarios.length} miembro(s) agregado(s) con éxito.` });
  } catch (e) {
    if (transaction.rolledBack === false) await transaction.rollback();
    fail(res, e);
  }
}

// 🔥 [CORREGIDO] Guarda en BD + Envía Push
async function addAlumnosToFamilia(req, res) {
  const { id_familia } = req.params;
  const { matriculas = [] } = req.body;

  if (!Array.isArray(matriculas) || matriculas.length === 0) {
    return bad(res, 'Se requiere un arreglo de matrículas.');
  }

  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    const results = { added: [], notFound: [], errors: [] };

    // 1. Info de Familia
    const reqFam = new sql.Request(transaction);
    reqFam.input('idFam', sql.Int, id_familia);
    const famResult = await reqFam.query("SELECT nombre_familia FROM dbo.Familias_EDI WHERE id_familia = @idFam");
    const nombreFamilia = famResult.recordset[0]?.nombre_familia || "Tu nueva familia";

    for (const matricula of matriculas) {
      try {
        const reqUser = new sql.Request(transaction);
        // Buscar Alumno
        const userResult = await reqUser.query(`
            SELECT id_usuario, fcm_token FROM dbo.Usuarios 
            WHERE matricula = ${parseInt(matricula)} AND tipo_usuario = 'ALUMNO'
        `);
        
        if (userResult.recordset.length === 0) {
          results.notFound.push(matricula);
          continue; 
        }
        
        const user = userResult.recordset[0];
        const id_usuario = user.id_usuario;

        // Insertar Miembro
        const reqMiembro = new sql.Request(transaction);
        reqMiembro.input('id_familia', sql.Int, id_familia);
        reqMiembro.input('id_usuario', sql.Int, id_usuario);
        reqMiembro.input('tipo_miembro', sql.NVarChar, 'HIJO'); 
        
        await reqMiembro.query(`
          IF NOT EXISTS (SELECT 1 FROM dbo.Miembros_Familia WHERE id_familia = @id_familia AND id_usuario = @id_usuario)
          BEGIN
            INSERT INTO dbo.Miembros_Familia (id_familia, id_usuario, tipo_miembro, activo, created_at)
            VALUES (@id_familia, @id_usuario, @tipo_miembro, 1, SYSDATETIME())
          END
        `);
        
        results.added.push(matricula);

        // --- 🔔 A. Notificación para el ALUMNO ---
        const tituloAlumno = 'Nueva Asignación 🏠';
        const mensajeAlumno = `Has sido asignado a la familia "${nombreFamilia}".`;

        // 1. Guardar en BD (Importante para que salga en la lista)
        const reqNotifAlumno = new sql.Request(transaction);
        reqNotifAlumno.input('uid', sql.Int, id_usuario);
        reqNotifAlumno.input('tit', sql.NVarChar, tituloAlumno);
        reqNotifAlumno.input('msg', sql.NVarChar, mensajeAlumno);
        reqNotifAlumno.input('type', sql.NVarChar, 'ASIGNACION');
        reqNotifAlumno.input('ref', sql.NVarChar, id_familia.toString());

        await reqNotifAlumno.query(`
          INSERT INTO dbo.Notificaciones (id_usuario, titulo, mensaje, tipo, id_referencia, leido, created_at)
          VALUES (@uid, @tit, @msg, @type, @ref, 0, SYSDATETIME())
        `);

        // 2. Enviar Push (Si tiene token)
        if (user.fcm_token) {
            try {
                // Ejecutamos fuera de la transacción crítica o en background
                enviarNotificacionPush(user.fcm_token, tituloAlumno, mensajeAlumno, { tipo: 'ASIGNACION', id_referencia: id_familia.toString() });
            } catch(e) { console.error("Error push alumno", e); }
        }

      } catch (err) {
        results.errors.push(`Error con matrícula ${matricula}: ${err.message}`);
      }
    }

    await transaction.commit(); // ✅ COMMIT DE LA TRANSACCIÓN

    // --- 🔔 B. Notificación para los PADRES ---
    // (Esto lo hacemos después del commit para no bloquear)
    if (results.added.length > 0) {
        try {
            // Buscamos Padres (Tokens + IDs)
            const padresResult = await queryP(`
                SELECT u.id_usuario, u.fcm_token 
                FROM dbo.Miembros_Familia mf
                JOIN dbo.Usuarios u ON mf.id_usuario = u.id_usuario
                JOIN dbo.Roles r ON u.id_rol = r.id_rol
                WHERE mf.id_familia = @idFam 
                  AND mf.activo = 1
                  AND r.nombre_rol IN ('Padre', 'Madre', 'Tutor', 'PapaEDI', 'MamaEDI')
            `, { idFam: { type: sql.Int, value: id_familia } });

            const padres = padresResult; 
            if (padres.length > 0) {
                const tituloPadres = 'Nuevos Miembros 👶';
                const mensajePadres = results.added.length === 1 
                    ? `Se ha asignado un nuevo alumno a tu familia.`
                    : `Se han asignado ${results.added.length} nuevos alumnos a tu familia.`;

                const tokensPadres = [];

                // Recorremos padres para guardar en BD uno por uno
                for (const padre of padres) {
                    await queryP(`
                        INSERT INTO dbo.Notificaciones (id_usuario, titulo, mensaje, tipo, id_referencia, leido, created_at)
                        VALUES (@uid, @tit, @msg, @type, @ref, 0, SYSDATETIME())
                    `, {
                        uid: { type: sql.Int, value: padre.id_usuario },
                        tit: { type: sql.NVarChar, value: tituloPadres },
                        msg: { type: sql.NVarChar, value: mensajePadres },
                        type: { type: sql.NVarChar, value: 'NUEVO_MIEMBRO' },
                        ref: { type: sql.NVarChar, value: id_familia.toString() }
                    });

                    if (padre.fcm_token && padre.fcm_token.length > 10) {
                        tokensPadres.push(padre.fcm_token);
                    }
                }

                // Enviar Push Masivo
                if (tokensPadres.length > 0) {
                    const uniqueTokens = [...new Set(tokensPadres)];
                    await enviarNotificacionMulticast(
                        uniqueTokens,
                        tituloPadres,
                        mensajePadres,
                        { tipo: 'NUEVO_MIEMBRO', id_referencia: id_familia.toString() }
                    );
                }
            }
        } catch(e) { console.error("Error push padres", e); }
    }

    ok(res, results);

  } catch (e) {
    if (transaction.rolledBack === false) await transaction.rollback();
    fail(res, e);
  }
}

module.exports = { add, byFamilia, remove, addAlumnosToFamilia, addBulk };
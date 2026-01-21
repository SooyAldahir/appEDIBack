const { sql, queryP, pool } = require('../dataBase/dbConnection');
const { ok, created, bad, fail } = require('../utils/http');
const { enviarNotificacionPush, enviarNotificacionMulticast } = require('../utils/firebase');

async function add(req, res) {
  try {
    const { id_familia, id_usuario, tipo_miembro } = req.body;
    const rows = await queryP(`
      INSERT INTO dbo.Miembros_Familia (id_familia, id_usuario, tipo_miembro, activo, created_at)
      OUTPUT INSERTED.id_miembro
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
    const rows = await queryP(`SELECT * FROM dbo.Miembros_Familia WHERE id_familia = @id AND activo = 1`, { id: { type: sql.Int, value: Number(req.params.id) }});
    ok(res, rows);
  } catch (e) { fail(res, e); }
}

async function remove(req, res) {
  try {
    const id = Number(req.params.id);
    await queryP(`DELETE FROM dbo.Miembros_Familia WHERE id_miembro = @id`, { id: { type: sql.Int, value: id }});
    ok(res, { message: 'Eliminado' });
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

async function addAlumnosToFamilia(req, res) {
  const { id_familia } = req.params;
  const { matriculas = [] } = req.body;

  if (!Array.isArray(matriculas) || matriculas.length === 0) return bad(res, 'Faltan matrículas');

  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    
    const fRes = await new sql.Request(transaction).query(`SELECT nombre_familia FROM dbo.Familias_EDI WHERE id_familia = ${id_familia}`);
    const nombreFamilia = fRes.recordset[0]?.nombre_familia || 'Familia';
    
    const results = { added: [], notFound: [], errors: [], usersNotif: [] };

    for (const matricula of matriculas) {
      try {
        const uReq = new sql.Request(transaction);
        const uRes = await uReq.query(`SELECT id_usuario, fcm_token FROM dbo.Usuarios WHERE matricula = ${parseInt(matricula)}`);
        
        if (!uRes.recordset.length) { results.notFound.push(matricula); continue; }
        
        const user = uRes.recordset[0];
        const mReq = new sql.Request(transaction);
        mReq.input('idF', sql.Int, id_familia);
        mReq.input('idU', sql.Int, user.id_usuario);
        await mReq.query(`
          IF NOT EXISTS (SELECT 1 FROM dbo.Miembros_Familia WHERE id_familia = @idF AND id_usuario = @idU)
          BEGIN
            INSERT INTO dbo.Miembros_Familia (id_familia, id_usuario, tipo_miembro, activo, created_at)
            VALUES (@idF, @idU, 'HIJO', 1, SYSDATETIME())
          END
        `);

        results.added.push(matricula);
        results.usersNotif.push(user); // Guardamos para notificar al final

      } catch (err) {
        results.errors.push(`Matrícula ${matricula}: ${err.message}`);
      }
    }

    await transaction.commit(); 

    // 🔔 ZONA SEGURA DE NOTIFICACIONES (Post-Commit)
    // Aquí es donde ocurría el error: usamos las columnas CORRECTAS.
    
    // A. Alumnos
    for (const u of results.usersNotif) {
        const tit = 'Nueva Asignación 🎒';
        const body = `Has sido asignado a la familia "${nombreFamilia}".`;

        // Intentar guardar en BD (No rompe el flujo si falla)
        queryP(`
            INSERT INTO dbo.Notificaciones (id_usuario_destino, titulo, cuerpo, tipo, id_referencia, leido, fecha_creacion)
            VALUES (@uid, @tit, @body, 'ASIGNACION', @ref, 0, GETDATE())
        `, {
            uid: { type: sql.Int, value: u.id_usuario },
            tit: { type: sql.NVarChar, value: tit },
            body: { type: sql.NVarChar, value: body },
            ref: { type: sql.Int, value: id_familia }
        }).catch(e => console.error("Error BD Notif Alumno:", e.message));

        // Enviar Push
        if (u.fcm_token) {
            enviarNotificacionPush(u.fcm_token, tit, body, { tipo: 'ASIGNACION', id_familia: id_familia.toString() });
        }
    }

    // B. Padres
    if (results.added.length > 0) {
        try {
            const padres = await queryP(`
                SELECT u.id_usuario, u.fcm_token 
                FROM dbo.Miembros_Familia mf
                JOIN dbo.Usuarios u ON mf.id_usuario = u.id_usuario
                JOIN dbo.Roles r ON u.id_rol = r.id_rol
                WHERE mf.id_familia = @idFam AND mf.activo = 1
                AND r.nombre_rol IN ('Padre', 'Madre', 'Tutor', 'PapaEDI', 'MamaEDI')
            `, { idFam: { type: sql.Int, value: id_familia } });

            const titP = 'Nuevos Miembros 👶';
            const bodyP = `Se han asignado ${results.added.length} nuevos alumnos a tu familia.`;
            const tokensP = [];

            for (const p of padres) {
                queryP(`
                    INSERT INTO dbo.Notificaciones (id_usuario_destino, titulo, cuerpo, tipo, id_referencia, leido, fecha_creacion)
                    VALUES (@uid, @tit, @body, 'NUEVO_MIEMBRO', @ref, 0, GETDATE())
                `, {
                    uid: { type: sql.Int, value: p.id_usuario },
                    tit: { type: sql.NVarChar, value: titP },
                    body: { type: sql.NVarChar, value: bodyP },
                    ref: { type: sql.Int, value: id_familia }
                }).catch(e => console.error("Error BD Notif Padre:", e.message));

                if (p.fcm_token) tokensP.push(p.fcm_token);
            }

            if (tokensP.length > 0) {
                enviarNotificacionMulticast(tokensP, titP, bodyP, { tipo: 'NUEVO_MIEMBRO', id_familia: id_familia.toString() });
            }
        } catch(e) { console.error("Error general notif padres:", e); }
    }

    ok(res, { added: results.added, notFound: results.notFound, errors: results.errors });

  } catch (e) {
    if (transaction.rolledBack === false) await transaction.rollback();
    fail(res, e);
  }
}

module.exports = { add, byFamilia, remove, addAlumnosToFamilia, addBulk };
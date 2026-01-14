const { sql, queryP, pool } = require('../dataBase/dbConnection');
const { ok, created, bad, fail } = require('../utils/http');
// 👇 1. IMPORTAR FIREBASE
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
    await queryP(`UPDATE dbo.Miembros_Familia SET activo = 0 WHERE id_miembro = @id`,
      { id: { type: sql.Int, value: id }});
    ok(res, { message: 'Miembro desactivado' });
  } catch (e) { fail(res, e); }
}

async function addBulk(req, res) {
  const transaction = new sql.Transaction(pool); 
  try {
    const { id_familia, id_usuarios } = req.body;

    await transaction.begin();

    for (const id_usuario of id_usuarios) {
      const request = new sql.Request(transaction);
      request.input('id_familia', sql.Int, id_familia);
      request.input('id_usuario', sql.Int, id_usuario);
      request.input('tipo_miembro', sql.NVarChar, 'ALUMNO_ASIGNADO');
      
      await request.query(`
        INSERT INTO dbo.Miembros_Familia (id_familia, id_usuario, tipo_miembro)
        VALUES (@id_familia, @id_usuario, @tipo_miembro)
      `);
    }

    await transaction.commit();
    ok(res, { message: `${id_usuarios.length} miembro(s) agregado(s) con éxito.` });

  } catch (e) {
    if (transaction.rolledBack === false) await transaction.rollback();
    fail(res, e);
  }
}

// 🔥 [MODIFICADO] Función de Asignación con Notificaciones
async function addAlumnosToFamilia(req, res) {
  const { id_familia } = req.params;
  const { matriculas = [] } = req.body;

  if (!Array.isArray(matriculas) || matriculas.length === 0) {
    return bad(res, 'Se requiere un arreglo de matrículas en el cuerpo de la petición.');
  }

  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();

    const results = { added: [], notFound: [], errors: [] };

    // Para evitar consultas repetitivas en el bucle, obtenemos info de la familia una vez
    const reqFam = new sql.Request(transaction);
    reqFam.input('idFam', sql.Int, id_familia);
    const famResult = await reqFam.query("SELECT nombre_familia FROM dbo.Familias_EDI WHERE id_familia = @idFam");
    const nombreFamilia = famResult.recordset[0]?.nombre_familia || "Tu nueva familia";

    for (const matricula of matriculas) {
      try {
        const reqUser = new sql.Request(transaction);
        // 1. Buscamos usuario y su token
        const userResult = await reqUser.query(`
            SELECT id_usuario, fcm_token, nombre, apellido 
            FROM dbo.Usuarios 
            WHERE matricula = ${parseInt(matricula)} AND tipo_usuario = 'ALUMNO'
        `);
        
        if (userResult.recordset.length === 0) {
          results.notFound.push(matricula);
          continue; 
        }
        
        const user = userResult.recordset[0];
        const id_usuario = user.id_usuario;

        // 2. Insertar en Miembros_Familia
        const reqMiembro = new sql.Request(transaction);
        reqMiembro.input('id_familia', sql.Int, id_familia);
        reqMiembro.input('id_usuario', sql.Int, id_usuario);
        reqMiembro.input('tipo_miembro', sql.NVarChar, 'HIJO'); // O 'ALUMNO_ASIGNADO' según tu lógica
        
        await reqMiembro.query(`
          IF NOT EXISTS (SELECT 1 FROM dbo.Miembros_Familia WHERE id_familia = @id_familia AND id_usuario = @id_usuario AND activo = 1)
          BEGIN
            INSERT INTO dbo.Miembros_Familia (id_familia, id_usuario, tipo_miembro)
            VALUES (@id_familia, @id_usuario, @tipo_miembro)
          END
        `);
        
        results.added.push(matricula);

        // --- 🔔 A. Notificar al Alumno ---
        if (user.fcm_token) {
            // Nota: Como estamos en transacción, idealmente haríamos esto después del commit.
            // Pero Firebase es externo, así que lo hacemos "fire and forget" o guardamos en lista para después.
            // Para simplicidad, lo ejecutamos aquí pero protegemos con try-catch para no romper la transacción.
            try {
                enviarNotificacionPush(
                    user.fcm_token,
                    'Nueva Asignación 🏠',
                    `Has sido asignado a la familia "${nombreFamilia}".`,
                    { tipo: 'ASIGNACION', id_referencia: id_familia.toString() }
                );
            } catch(e) { console.error("Error push alumno", e); }
        }

      } catch (err) {
        results.errors.push(`Error con matrícula ${matricula}: ${err.message}`);
      }
    }

    await transaction.commit();

    // --- 🔔 B. Notificar a los Padres (después del commit) ---
    if (results.added.length > 0) {
        try {
            // Buscamos tokens de los padres de esta familia
            // Nota: create_at > hoy es una forma sucia, mejor buscamos por rol en esa familia
            const padresQuery = `
                SELECT u.fcm_token 
                FROM dbo.Miembros_Familia mf
                JOIN dbo.Usuarios u ON mf.id_usuario = u.id_usuario
                JOIN dbo.Roles r ON u.id_rol = r.id_rol
                WHERE mf.id_familia = @idFam 
                  AND mf.activo = 1
                  AND r.nombre_rol IN ('Padre', 'Madre', 'Tutor', 'PapaEDI', 'MamaEDI')
                  AND u.fcm_token IS NOT NULL
            `;
            const padresRows = await queryP(padresQuery, { idFam: { type: sql.Int, value: id_familia } });
            const tokensPadres = padresRows.map(p => p.fcm_token);

            if (tokensPadres.length > 0) {
                const mensaje = results.added.length === 1 
                    ? `Se ha asignado un nuevo alumno a tu familia.`
                    : `Se han asignado ${results.added.length} nuevos alumnos a tu familia.`;

                enviarNotificacionMulticast(
                    tokensPadres,
                    'Nuevos Miembros 👶',
                    mensaje,
                    { tipo: 'NUEVO_MIEMBRO', id_referencia: id_familia.toString() }
                );
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
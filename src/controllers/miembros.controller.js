// controllers/miembros.controller.js
const { sql, queryP, pool } = require('../dataBase/dbConnection');
const { ok, created, bad, fail } = require('../utils/http');

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
  const transaction = new sql.Transaction(pool); // <-- Ahora 'pool' está definido
  try {
    const { id_familia, id_usuarios } = req.body;

    await transaction.begin();

    for (const id_usuario of id_usuarios) {
      const request = new sql.Request(transaction);
      request.input('id_familia', sql.Int, id_familia);
      request.input('id_usuario', sql.Int, id_usuario);
      request.input('tipo_miembro', sql.NVarChar, 'HIJO');
      
      await request.query(`
        INSERT INTO dbo.Miembros_Familia (id_familia, id_usuario, tipo_miembro)
        VALUES (@id_familia, @id_usuario, @tipo_miembro)
      `);
    }

    await transaction.commit();
    ok(res, { message: `${id_usuarios.length} miembro(s) agregado(s) con éxito.` });

  } catch (e) {
    if (transaction.rolledBack === false) {
      await transaction.rollback();
    }
    fail(res, e);
  }
}

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

    for (const matricula of matriculas) {
      try {
        const reqUser = new sql.Request(transaction);
        // 1. Buscar el id_usuario del alumno por matrícula
        const userResult = await reqUser.query(`SELECT id_usuario FROM dbo.Usuarios WHERE matricula = ${parseInt(matricula)} AND tipo_usuario = 'ALUMNO'`);
        
        if (userResult.recordset.length === 0) {
          results.notFound.push(matricula);
          continue; // Si no lo encuentra, pasa a la siguiente matrícula
        }
        
        const id_usuario = userResult.recordset[0].id_usuario;

        // 2. Insertar en Miembros_Familia (evitando duplicados si ya existe)
        const reqMiembro = new sql.Request(transaction);
        reqMiembro.input('id_familia', sql.Int, id_familia);
        reqMiembro.input('id_usuario', sql.Int, id_usuario);
        reqMiembro.input('tipo_miembro', sql.NVarChar, 'HIJO');
        
        // Esta query inserta el miembro solo si no existe ya una relación activa
        await reqMiembro.query(`
          IF NOT EXISTS (SELECT 1 FROM dbo.Miembros_Familia WHERE id_familia = @id_familia AND id_usuario = @id_usuario AND activo = 1)
          BEGIN
            INSERT INTO dbo.Miembros_Familia (id_familia, id_usuario, tipo_miembro)
            VALUES (@id_familia, @id_usuario, @tipo_miembro)
          END
        `);
        
        results.added.push(matricula);

      } catch (err) {
        results.errors.push(`Error con matrícula ${matricula}: ${err.message}`);
      }
    }

    await transaction.commit();
    ok(res, results);

  } catch (e) {
    if (transaction.rolledBack === false) {
      await transaction.rollback();
    }
    fail(res, e);
  }
}

module.exports = { add, byFamilia, remove, addAlumnosToFamilia, addBulk };

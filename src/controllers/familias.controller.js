const { sql, pool, queryP } = require('../dataBase/dbConnection');
const { ok, created, bad, notFound, fail } = require('../utils/http');
const { Q } = require('../queries/familias.queries');
const MiembrosQ = require('../queries/miembros.queries').Q;
const path = require('path');

// helper para inyectar el SELECT base con JOIN
const withBase = (tpl) => tpl.replace('{{BASE}}', Q.base);

exports.list = async (_req, res) => {
  try {
    const rows = await queryP(withBase(Q.list));
    ok(res, rows);
  } catch (e) { fail(res, e); }
};

exports.get = async (req, res) => {
  try {
    const id_familia = Number(req.params.id);

    // 1. Obtener los detalles base de la familia
    const rows = await queryP(withBase(Q.byId), {
      id_familia: { type: sql.Int, value: id_familia },
    });
    if (!rows.length) return notFound(res);
    
    const familia = rows[0];

    // 2. Obtener los miembros de esa familia
    const miembros = await queryP(MiembrosQ.listByFamilia, {
      id_familia: { type: sql.Int, value: id_familia },
    });

    // 3. Adjuntar los miembros a la respuesta
    familia.miembros = miembros;

    ok(res, familia);
  } catch (e) { fail(res, e); }
};

exports.searchByName = async (req, res) => {
  try {
    const name = (req.query.name || '').trim();
    if (!name) return res.json([]);
    const like = `%${name}%`;

    const rows = await queryP(withBase(Q.byName), {
      like: { type: sql.NVarChar, value: like },
    });
    // devolvemos snake_case (tu mapper ya lo entiende)
    res.json(rows);
  } catch (e) {
    console.error('searchByName', e);
    res.status(500).json([]);
  }
};

exports.searchByDocument = async (req, res) => {
  try {
    const matricula = req.query.matricula?.trim();
    const numEmpleado = req.query.numEmpleado?.trim();
    if (!matricula && !numEmpleado) return res.json([]);

    const ident = matricula || numEmpleado;

    const rows = await queryP(withBase(Q.byIdent), {
      ident: { type: sql.NVarChar, value: ident },
    });

    res.json(rows);
  } catch (e) {
    console.error('searchByDocument', e);
    res.status(500).json([]);
  }
};

exports.create = async (req, res) => {
  const transaction = new sql.Transaction(pool);
  try {
    const { nombre_familia, papa_id, mama_id, residencia, direccion, hijos = [] } = req.body;
    if (!nombre_familia || !residencia) return bad(res, 'nombre_familia y residencia requeridos');

    await transaction.begin();
    const request = new sql.Request(transaction);

    // 1. Insertar la familia y obtener su ID
    request.input('nombre_familia', sql.NVarChar, nombre_familia);
    request.input('residencia', sql.NVarChar, residencia);
    request.input('direccion', sql.NVarChar, direccion ?? null);
    request.input('papa_id', sql.Int, papa_id ?? null);
    request.input('mama_id', sql.Int, mama_id ?? null);
    
    // Usamos una query que devuelve el ID
    const familiaResult = await request.query(`
      INSERT INTO dbo.Familias_EDI (nombre_familia, residencia, direccion, papa_id, mama_id)
      OUTPUT INSERTED.id_familia
      VALUES (@nombre_familia, @residencia, @direccion, @papa_id, @mama_id);
    `);

    if (!familiaResult.recordset[0] || !familiaResult.recordset[0].id_familia) {
      throw new Error('No se pudo crear la familia o obtener el ID.');
    }
    const id_familia = familiaResult.recordset[0].id_familia;

    // 2. Insertar miembros (Padre, Madre, Hijos)
    const miembrosAIngresar = [];
    if (papa_id) miembrosAIngresar.push({ id_usuario: papa_id, tipo: 'PADRE' });
    if (mama_id) miembrosAIngresar.push({ id_usuario: mama_id, tipo: 'MADRE' });
    if (hijos && hijos.length > 0) {
      hijos.forEach(hijo_id => miembrosAIngresar.push({ id_usuario: hijo_id, tipo: 'HIJO' }));
    }

    for (const miembro of miembrosAIngresar) {
      const miembroRequest = new sql.Request(transaction);
      miembroRequest.input('id_familia', sql.Int, id_familia);
      miembroRequest.input('id_usuario', sql.Int, miembro.id_usuario);
      miembroRequest.input('tipo_miembro', sql.NVarChar, miembro.tipo);
      await miembroRequest.query(MiembrosQ.add); // Usando la query del archivo de queries
    }

    await transaction.commit();

    // 3. Devolver la familia completa con los nombres de los padres (como antes)
    const finalRows = await queryP(withBase(Q.byId), {
      id_familia: { type: sql.Int, value: id_familia },
    });

    return created(res, finalRows[0]);

  } catch (e) {
    if (transaction.rolledBack === false) {
      await transaction.rollback();
    }
    fail(res, e);
  }
};

exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { nombre_familia, papa_id, mama_id, residencia, direccion } = req.body;

    // 1) update
    await queryP(Q.update, {
      id_familia:     { type: sql.Int,      value: id },
      nombre_familia: { type: sql.NVarChar, value: nombre_familia ?? null },
      papa_id:        { type: sql.Int,      value: papa_id ?? null },
      mama_id:        { type: sql.Int,      value: mama_id ?? null },
      residencia:     { type: sql.NVarChar, value: residencia ?? null },
      direccion:      { type: sql.NVarChar, value: direccion ?? null },
    });

    // 2) devuelve fila join-eada
    const rows = await queryP(withBase(Q.byId), {
      id_familia: { type: sql.Int, value: id },
    });
    if (!rows.length) return notFound(res);
    ok(res, rows[0]);
  } catch (e) { fail(res, e); }
};

exports.remove = async (req, res) => {
  try {
    await queryP(Q.softDelete, {
      id_familia: { type: sql.Int, value: Number(req.params.id) },
    });
    ok(res, { message: 'Familia desactivada' });
  } catch (e) { fail(res, e); }
};

exports.byIdent = async (req, res) => {
  try {
    const ident = Number(req.params.ident);
    if (Number.isNaN(ident)) return bad(res, 'ident debe ser numérico (matrícula o num_empleado)');

    const rows = await queryP(withBase(Q.byIdent), {
      ident: { type: sql.Int, value: ident },
    });
    ok(res, rows);
  } catch (e) { fail(res, e); }
};

exports.reporteCompleto = async (_req, res) => {
  try {
    const rows = await queryP(Q.reporteCompleto);

    // Agrupamos los resultados por familia
    const familiasMap = new Map();

    for (const row of rows) {
      if (!familiasMap.has(row.id_familia)) {
        familiasMap.set(row.id_familia, {
          id_familia: row.id_familia,
          nombre_familia: row.nombre_familia,
          residencia: row.residencia,
          papa_nombre: row.papa_nombre,
          mama_nombre: row.mama_nombre,
          hijos_en_casa: [],
          alumnos_asignados: [],
          total_miembros: 0
        });
      }

      const familia = familiasMap.get(row.id_familia);

      if (row.id_usuario) { // Si hay un miembro (hijo o alumno)
        const miembroNombre = row.miembro_nombre;
        
        if (row.tipo_miembro === 'HIJO' && !familia.hijos_en_casa.includes(miembroNombre)) {
          familia.hijos_en_casa.push(miembroNombre);
        } else if (row.tipo_miembro === 'ALUMNO_ASIGNADO' && !familia.alumnos_asignados.includes(miembroNombre)) {
          familia.alumnos_asignados.push(miembroNombre);
        }
      }
    }
    
    // Contar miembros (Padres + Hijos + Alumnos)
    familiasMap.forEach(familia => {
       let count = 0;
       if (familia.papa_nombre) count++;
       if (familia.mama_nombre) count++;
       count += familia.hijos_en_casa.length;
       count += familia.alumnos_asignados.length;
       familia.total_miembros = count;
    });

    ok(res, Array.from(familiasMap.values()));
  } catch (e) {
    fail(res, e);
  }
};

const saveFile = (file, id_familia) => {
  if (!file) return null;
  
  // 1. Crear un nombre de archivo único
  const fileName = `familia-${id_familia}-${Date.now()}${path.extname(file.name)}`;
  
  // 2. Definir la ruta de guardado
  // __dirname es /src/controllers, así que subimos un nivel a /src
  // y luego a public/uploads
  const savePath = path.join(__dirname, '..', 'public', 'uploads', fileName);

  // 3. Mover el archivo
  file.mv(savePath); // Mueve el archivo temporal a la carpeta 'public/uploads'
  
  // 4. Devolver la URL pública
  // (Asumimos que la API está en la raíz, ej: http://localhost:3000)
  return `/uploads/${fileName}`; 
};

exports.uploadFotos = async (req, res) => {
  try {
    const id_familia = Number(req.params.id);
    if (!req.files) return bad(res, 'No se subió ningún archivo.');

    // 1. Procesar y guardar los archivos (si existen)
    const urlPortada = saveFile(req.files.foto_portada, id_familia);
    const urlPerfil = saveFile(req.files.foto_perfil, id_familia);

    if (!urlPortada && !urlPerfil) return bad(res, 'No se subieron archivos válidos.');

    // 2. Actualizar la base de datos con las nuevas URLs
    const rows = await queryP(Q.updateFotos, {
      id_familia: { type: sql.Int, value: id_familia },
      foto_portada_url: { type: sql.NVarChar, value: urlPortada },
      foto_perfil_url: { type: sql.NVarChar, value: urlPerfil }
    });

    if (!rows.length) return notFound(res);
    ok(res, rows[0]); // Devuelve la familia con las URLs actualizadas
    
  } catch (e) {
    fail(res, e);
  }
};

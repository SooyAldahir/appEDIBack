const { sql, query, queryP } = require('../dataBase/dbConnection');
const { ok, created, bad, notFound, fail } = require('../utils/http');
const { Q } = require('../queries/familias.queries');

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
    const rows = await queryP(withBase(Q.byId), {
      id_familia: { type: sql.Int, value: Number(req.params.id) },
    });
    if (!rows.length) return notFound(res);
    ok(res, rows[0]);
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
  try {
    const { nombre_familia, papa_id, mama_id, residencia, direccion } = req.body;
    if (!nombre_familia) return bad(res, 'nombre_familia requerido');
    if (!residencia)     return bad(res, 'residencia requerida');

    // 1) Insert y obtener id
    const ins = await queryP(Q.insert, {
      nombre_familia: { type: sql.NVarChar, value: nombre_familia },
      papa_id:        { type: sql.Int,     value: papa_id ?? null },
      mama_id:        { type: sql.Int,     value: mama_id ?? null },
      residencia:     { type: sql.NVarChar, value: residencia },
      direccion:      { type: sql.NVarChar, value: direccion ?? null },
    });
    const id = ins[0]?.id_familia ?? ins[0]?.id ?? ins[0]; // por si el driver devuelve distinto alias

    // 2) Relee con JOIN para traer papa_nombre/mama_nombre
    const rows = await queryP(withBase(Q.byId), {
      id_familia: { type: sql.Int, value: Number(id) },
    });

    return created(res, rows[0]);
  } catch (e) { fail(res, e); }
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

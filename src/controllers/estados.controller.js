const { sql, queryP } = require('../dataBase/dbConnection');
const { ok, created, bad, notFound, fail } = require('../utils/http');
const { Q } = require('../queries/estados.queries');

// Listar catálogo
exports.getCatalog = async (req, res) => {
  try {
    const list = await queryP(Q.getCatalog);
    ok(res, list);
  } catch (e) { fail(res, e); }
};

exports.create = async (req, res) => {
  try {
    const { id_usuario, id_cat_estado, fecha_inicio, fecha_fin, unico_vigente = true } = req.body;
    
    if (!id_usuario || !id_cat_estado) return bad(res, 'id_usuario e id_cat_estado requeridos');

    // Obtener nombre del estado
    const catalogo = await queryP('SELECT descripcion FROM dbo.Cat_Estados WHERE id_cat_estado = @id', { id: { type: sql.Int, value: id_cat_estado }});
    const nombreEstado = catalogo[0]?.descripcion || 'Desconocido';

    if (unico_vigente) {
      await queryP(Q.closePrevActives, { id_usuario: { type: sql.Int, value: id_usuario } });
    }

    // Insertar en historial (Estados_Alumno)
    const rows = await queryP(Q.create, {
      id_usuario:   { type: sql.Int, value: id_usuario },
      id_cat_estado:{ type: sql.Int, value: id_cat_estado },
      tipo_estado:  { type: sql.NVarChar, value: nombreEstado },
      fecha_inicio: { type: sql.DateTime, value: fecha_inicio ?? null },
      fecha_fin:    { type: sql.DateTime, value: fecha_fin ?? null },
      activo:       { type: sql.Bit, value: 1 }
    });

    // Actualizar tabla Usuarios para que el cambio se vea en el perfil 
    await queryP(Q.updateUserStatus, {
      id_usuario: { type: sql.Int, value: id_usuario },
      estado:     { type: sql.NVarChar, value: nombreEstado }
    });

    created(res, rows[0]);
  } catch (e) { fail(res, e); }
};

exports.listByUsuario = async (req, res) => {
  try {
    ok(res, await queryP(Q.listByUsuario, { id_usuario: { type: sql.Int, value: Number(req.params.id_usuario) } }));
  } catch (e) { fail(res, e); }
};

exports.close = async (req, res) => {
  try {
    const rows = await queryP(Q.close, { id_estado: { type: sql.Int, value: Number(req.params.id) } });
    if (!rows.length) return notFound(res);
    ok(res, rows[0]);
  } catch (e) { fail(res, e); }
};
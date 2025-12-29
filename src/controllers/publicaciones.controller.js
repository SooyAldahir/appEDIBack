const { sql, queryP } = require('../dataBase/dbConnection');
const { ok, created, bad, notFound, fail } = require('../utils/http');
const { Q } = require('../queries/publicaciones.queries');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // Usamos uuid para nombres únicos

exports.create = async (req, res) => {
  try {
    const { id_familia, id_usuario, categoria_post, mensaje } = req.body;
    
    // 1. Lógica para express-fileupload
    let url_imagen = null;

    if (req.files && req.files.image) { // 'image' es el nombre del campo que enviamos desde Flutter
      const archivo = req.files.image;
      
      // Generar nombre único para evitar colisiones
      const extension = path.extname(archivo.name);
      const nombreArchivo = `${Date.now()}-${Math.round(Math.random() * 1E9)}${extension}`;
      
      // Definir ruta de guardado (carpeta public/uploads)
      const uploadPath = path.join(__dirname, '../public/uploads', nombreArchivo);

      // Mover el archivo a la carpeta
      await archivo.mv(uploadPath);
      
      // Guardar la URL relativa para la BD
      url_imagen = `/uploads/${nombreArchivo}`;
    }

    if (!id_usuario || !categoria_post) return bad(res, 'id_usuario y categoria_post requeridos');
    
    // 2. Insertar en Base de Datos (incluyendo url_imagen)
    const rows = await queryP(Q.create, {
      id_familia:     { type: sql.Int, value: id_familia ?? null },
      id_usuario:     { type: sql.Int, value: id_usuario },
      categoria_post: { type: sql.NVarChar, value: categoria_post },
      mensaje:        { type: sql.NVarChar, value: mensaje ?? null },
      url_imagen:     { type: sql.NVarChar, value: url_imagen } 
    });

    created(res, rows[0]);
  } catch (e) { 
    console.error(e); // Importante para ver errores en consola
    fail(res, e); 
  }
};

// ... El resto de tus funciones (listByFamilia, setEstado, etc.) se quedan igual
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
    if (!['Pendiente','Aprobada','Rechazada'].includes(estado)) return bad(res, 'estado inválido');
    const rows = await queryP(Q.setEstado, {
      estado:  { type: sql.NVarChar, value: estado },
      id_post: { type: sql.Int, value: Number(req.params.id) }
    });
    if (!rows.length) return notFound(res);
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
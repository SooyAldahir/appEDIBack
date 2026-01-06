const { sql, queryP } = require('../dataBase/dbConnection');

// 👇 Usamos module.exports directo para que tus rutas no fallen
module.exports = async function authGuard(req, res, next) {
  try {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7).trim() : null;
    
    // console.log("🔐 AuthGuard recibió token:", token); // Descomenta si necesitas depurar

    if (!token) return res.status(401).json({ error: 'No autenticado' });

    // 👇 CONSULTA MODIFICADA:
    // 1. Agregamos u.estado al SELECT para poder revisarlo.
    // 2. QUITAMOS el filtro 'u.activo=1' y 'u.estado=Activo' del WHERE.
    const rs = await queryP(`
      SELECT u.id_usuario, u.nombre, u.apellido, u.correo, u.tipo_usuario,
             u.id_rol, u.session_token, u.foto_perfil,
             u.estado, -- <--- Importante traer esto
             r.nombre_rol
      FROM dbo.Usuarios u
      JOIN dbo.Roles r ON r.id_rol = u.id_rol
      WHERE u.session_token = @t
    `, { t: { type: sql.NVarChar, value: token } });

    if (!rs.length) return res.status(401).json({ error: 'Token inválido o sesión expirada' });

    const usuario = rs[0];

    // 👇 REGLA DE ORO (Lógica de Negocio):
    // Bloqueamos SOLO si dice exactamente 'Baja Temporal'.
    // Si es 'Inactivo', 'Baja Definitiva' (si quisieras), o cualquier otro, lo deja pasar (para leer historial).
    if (usuario.estado === 'Baja Temporal') {
        return res.status(403).json({ error: 'Acceso denegado: Baja Temporal' });
    }

    // Si pasó el filtro, guardamos el usuario y seguimos
    req.user = usuario;
    next();

  } catch (e) {
    console.error('authGuard error:', e);
    res.status(500).json({ error: 'Error de autenticación' });
  }
};
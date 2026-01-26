const { sql, queryP } = require('../dataBase/dbConnection');


module.exports = async function authGuard(req, res, next) {
  try {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7).trim() : null;
    


    if (!token) return res.status(401).json({ error: 'No autenticado' });

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
    if (usuario.estado === 'Baja Temporal') {
        return res.status(403).json({ error: 'Acceso denegado: Baja Temporal' });
    }
    req.user = usuario;
    next();

  } catch (e) {
    console.error('authGuard error:', e);
    res.status(500).json({ error: 'Error de autenticación' });
  }
};
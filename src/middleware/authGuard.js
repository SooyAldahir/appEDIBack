const { sql, queryP } = require('../dataBase/dbConnection');

module.exports = async function authGuard(req, res, next) {
  try {
        
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7).trim() : null;
    console.log("🔐 AuthGuard recibió token:", token);
    if (!token) return res.status(401).json({ error: 'No autenticado' });

    const rs = await queryP(`
      SELECT u.id_usuario,u.nombre,u.apellido,u.correo,u.tipo_usuario,u.id_rol,u.session_token,
             r.nombre_rol
      FROM dbo.Usuarios u
      JOIN dbo.Roles r ON r.id_rol=u.id_rol
      WHERE u.session_token=@t AND u.activo=1 AND u.estado=N'Activo'
    `, { t: { type: sql.NVarChar, value: token } });

    if (!rs.length) return res.status(401).json({ error: 'Token inválido' });

    req.user = rs[0];
    next();
  } catch (e) {
    console.error('authGuard error:', e);
    res.status(500).json({ error: 'Error de autenticación' });
  }
};

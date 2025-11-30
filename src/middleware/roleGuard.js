module.exports = (...allowed) => (req, res, next) => {
  if (process.env.BYPASS_AUTH === '1') return next(); 
  const rolesUsuario = [req.user?.nombre_rol, req.user?.tipo_usuario].filter(Boolean);
  const ok = rolesUsuario.some(r => allowed.includes(r));
  if (!ok) return res.status(403).json({ error: 'Forbidden' });
  next();
};

exports.Q = {
  // CORREGIDO: Usamos SELECT SCOPE_IDENTITY() en lugar de OUTPUT para evitar error con Triggers
  create: `
    INSERT INTO dbo.Publicaciones (id_familia, id_usuario, categoria_post, mensaje, url_imagen, estado, tipo, activo, created_at)
    VALUES (@id_familia, @id_usuario, @categoria_post, @mensaje, @url_imagen, @estado, @tipo, 1, GETDATE());
    
    SELECT * FROM dbo.Publicaciones WHERE id_post = SCOPE_IDENTITY();
  `,

  // Consultas de lectura (estas no cambian)
  getUserRole: `
    SELECT r.nombre_rol, u.nombre, u.apellido 
    FROM dbo.Usuarios u 
    JOIN dbo.Roles r ON r.id_rol = u.id_rol 
    WHERE u.id_usuario = @id_usuario
  `,

  getTokensPadres: `
    SELECT u.fcm_token 
    FROM dbo.Usuarios u
    JOIN dbo.Miembros_Familia mf ON mf.id_usuario = u.id_usuario
    JOIN dbo.Roles r ON r.id_rol = u.id_rol
    WHERE mf.id_familia = @id_familia 
      AND mf.activo = 1 
      AND u.activo = 1
      AND (r.nombre_rol IN ('Padre', 'Madre', 'Tutor', 'Admin', 'PapaEDI', 'MamaEDI'))
      AND u.fcm_token IS NOT NULL
  `,

  listAprobadas: `
    SELECT p.*, u.nombre, u.apellido, u.foto_perfil
    FROM dbo.Publicaciones p
    JOIN dbo.Usuarios u ON u.id_usuario = p.id_usuario
    WHERE (p.estado = 'Publicado' OR p.estado = 'Aprobada') AND p.activo = 1
    ORDER BY p.fecha_publicacion DESC
  `,

  listPendientesPorFamilia: `
    SELECT p.*, u.nombre, u.apellido, u.foto_perfil
    FROM dbo.Publicaciones p
    JOIN dbo.Usuarios u ON u.id_usuario = p.id_usuario
    WHERE p.id_familia = @id_familia AND p.estado = 'Pendiente' AND p.activo = 1
  `,

  listByFamilia: `
    SELECT p.*, u.nombre, u.apellido, u.foto_perfil
    FROM dbo.Publicaciones p
    JOIN dbo.Usuarios u ON u.id_usuario = p.id_usuario
    WHERE p.id_familia = @id_familia AND p.activo = 1
      AND (p.estado = 'Publicado' OR p.estado = 'Aprobada')
    ORDER BY p.fecha_publicacion DESC
  `,

  listInstitucional: `
    SELECT p.*, u.nombre, u.apellido
    FROM dbo.Publicaciones p
    JOIN dbo.Usuarios u ON u.id_usuario = p.id_usuario
    WHERE p.id_familia IS NULL AND p.categoria_post = N'Institucional' AND p.activo = 1
    ORDER BY p.fecha_publicacion DESC
  `,

  // CORREGIDO: Usamos SELECT posterior en lugar de OUTPUT para evitar error con Triggers
  setEstado: `
    UPDATE dbo.Publicaciones
    SET estado = @estado, updated_at = GETDATE()
    WHERE id_post = @id_post;

    SELECT * FROM dbo.Publicaciones WHERE id_post = @id_post;
  `,
  
  softDelete: `UPDATE dbo.Publicaciones SET activo = 0, updated_at = GETDATE() WHERE id_post = @id_post`
};
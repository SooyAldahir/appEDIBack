exports.Q = {
  create: `
    INSERT INTO dbo.Publicaciones (id_familia, id_usuario, categoria_post, mensaje, url_imagen, estado, activo)
    OUTPUT INSERTED.* VALUES (@id_familia, @id_usuario, @categoria_post, @mensaje, @url_imagen, 'Pendiente', 1)
  `,
  // Para la sección de "Noticias" (News) - Solo aprobadas
  listAprobadas: `
    SELECT p.*, u.nombre, u.apellido
    FROM dbo.Publicaciones p
    JOIN dbo.Usuarios u ON u.id_usuario = p.id_usuario
    WHERE p.estado = 'Aprobada' AND p.activo = 1
    ORDER BY p.fecha_publicacion DESC
  `,
  // Para que el padre vea las pendientes de su familia
  listPendientesPorFamilia: `
    SELECT p.*, u.nombre, u.apellido, u.foto_perfil
    FROM dbo.Publicaciones p
    JOIN dbo.Usuarios u ON u.id_usuario = p.id_usuario
    WHERE p.id_familia = @id_familia AND p.estado = 'Pendiente' AND p.activo = 1
  `,
  listByFamilia: `
    SELECT p.*, u.nombre, u.apellido
    FROM dbo.Publicaciones p
    JOIN dbo.Usuarios u ON u.id_usuario = p.id_usuario
    WHERE p.id_familia = @id_familia AND p.activo = 1
    ORDER BY p.fecha_publicacion DESC
  `,
  listInstitucional: `
    SELECT p.*, u.nombre, u.apellido
    FROM dbo.Publicaciones p
    JOIN dbo.Usuarios u ON u.id_usuario = p.id_usuario
    WHERE p.id_familia IS NULL AND p.categoria_post = N'Institucional' AND p.activo = 1
    ORDER BY p.fecha_publicacion DESC
  `,
  setEstado: `
    UPDATE dbo.Publicaciones
    SET estado = @estado, updated_at = GETDATE()
    OUTPUT INSERTED.* WHERE id_post = @id_post
  `,
  softDelete: `UPDATE dbo.Publicaciones SET activo = 0, updated_at = GETDATE() WHERE id_post = @id_post`
};

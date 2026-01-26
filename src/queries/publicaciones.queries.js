exports.Q = {
  create: `
    INSERT INTO dbo.Publicaciones (id_familia, id_usuario, categoria_post, mensaje, url_imagen, estado, tipo, activo, created_at)
    VALUES (@id_familia, @id_usuario, @categoria_post, @mensaje, @url_imagen, @estado, @tipo, 1, GETDATE());
    
    SELECT * FROM dbo.Publicaciones WHERE id_post = SCOPE_IDENTITY();
  `,

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
    SELECT 
        p.*, 
        u.nombre, u.apellido, u.foto_perfil,
        f.nombre_familia,
        (SELECT COUNT(*) FROM Publicaciones_Likes pl WHERE pl.id_post = p.id_post) as likes_count,
        (SELECT COUNT(*) FROM Publicaciones_Comentarios pc WHERE pc.id_post = p.id_post AND pc.activo = 1) as comentarios_count,
        CASE WHEN EXISTS (SELECT 1 FROM Publicaciones_Likes pl WHERE pl.id_post = p.id_post AND pl.id_usuario = @current_user_id) THEN 1 ELSE 0 END as is_liked
    FROM dbo.Publicaciones p
    JOIN dbo.Usuarios u ON u.id_usuario = p.id_usuario
    LEFT JOIN dbo.Familias_EDI f ON f.id_familia = p.id_familia
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
  
  setEstado: `
    UPDATE dbo.Publicaciones
    SET estado = @estado, updated_at = GETDATE()
    WHERE id_post = @id_post;

    SELECT * FROM dbo.Publicaciones WHERE id_post = @id_post;
  `,
  
  softDelete: `UPDATE dbo.Publicaciones SET activo = 0, updated_at = GETDATE() WHERE id_post = @id_post`,
  listByUsuario: `
    SELECT p.*, u.nombre, u.apellido
    FROM dbo.Publicaciones p
    JOIN dbo.Usuarios u ON u.id_usuario = p.id_usuario
    WHERE p.id_usuario = @id_usuario AND p.activo = 1
    ORDER BY p.created_at DESC
  `,
  toggleLike: `
    IF EXISTS (SELECT 1 FROM Publicaciones_Likes WHERE id_post = @id_post AND id_usuario = @id_usuario)
    BEGIN
        DELETE FROM Publicaciones_Likes WHERE id_post = @id_post AND id_usuario = @id_usuario;
        SELECT 0 as liked; -- Se quitó el like
    END
    ELSE
    BEGIN
        INSERT INTO Publicaciones_Likes (id_post, id_usuario) VALUES (@id_post, @id_usuario);
        SELECT 1 as liked; -- Se puso el like
    END
  `,
  addComentario: `
    INSERT INTO Publicaciones_Comentarios (id_post, id_usuario, contenido)
    VALUES (@id_post, @id_usuario, @contenido);
    SELECT SCOPE_IDENTITY() as id_comentario;
  `,
  getComentarios: `
    SELECT c.*, u.nombre, u.apellido, u.foto_perfil
    FROM Publicaciones_Comentarios c
    JOIN dbo.Usuarios u ON u.id_usuario = c.id_usuario
    WHERE c.id_post = @id_post AND c.activo = 1
    ORDER BY c.created_at ASC
  `,
  listGlobal: `
    SELECT 
        p.*, 
        u.nombre, u.apellido, u.foto_perfil,
        f.nombre_familia,
        (SELECT COUNT(*) FROM dbo.Publicaciones_Likes pl WHERE pl.id_post = p.id_post) as likes_count,
        (SELECT COUNT(*) FROM dbo.Publicaciones_Comentarios pc WHERE pc.id_post = p.id_post AND pc.activo = 1) as comentarios_count,
        CASE WHEN EXISTS (SELECT 1 FROM dbo.Publicaciones_Likes pl WHERE pl.id_post = p.id_post AND pl.id_usuario = @current_user_id) THEN 1 ELSE 0 END as is_liked
    FROM dbo.Publicaciones p
    JOIN dbo.Usuarios u ON u.id_usuario = p.id_usuario
    LEFT JOIN dbo.Familias_EDI f ON f.id_familia = p.id_familia
    WHERE p.activo = 1
      AND (p.estado = 'Publicado' OR p.estado = 'Aprobada')
    ORDER BY p.created_at DESC
  `,
};
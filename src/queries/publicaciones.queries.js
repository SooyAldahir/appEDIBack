exports.Q = {
  create: `
    INSERT INTO EDI.Publicaciones (id_familia, id_usuario, categoria_post, mensaje, url_imagen, estado, tipo, activo, created_at)
    VALUES (@id_familia, @id_usuario, @categoria_post, @mensaje, @url_imagen, @estado, @tipo, 1, GETDATE());
    
    SELECT * FROM EDI.Publicaciones WHERE id_post = SCOPE_IDENTITY();
  `,

  getUserRole: `
    SELECT r.nombre_rol, u.nombre, u.apellido 
    FROM EDI.Usuarios u 
    JOIN EDI.Roles r ON r.id_rol = u.id_rol 
    WHERE u.id_usuario = @id_usuario
  `,

  getTokensPadres: `
    SELECT u.fcm_token 
    FROM EDI.Usuarios u
    JOIN EDI.Miembros_Familia mf ON mf.id_usuario = u.id_usuario
    JOIN EDI.Roles r ON r.id_rol = u.id_rol
    WHERE mf.id_familia = @id_familia 
      AND mf.activo = 1 
      AND u.activo = 1
      AND (r.nombre_rol IN ('Padre', 'Madre', 'Tutor', 'Admin', 'PapaEDI', 'MamaEDI'))
      AND u.fcm_token IS NOT NULL
  `,

  listAprobadas: `
    SELECT p.*, u.nombre, u.apellido, u.foto_perfil
    FROM EDI.Publicaciones p
    JOIN EDI.Usuarios u ON u.id_usuario = p.id_usuario
    WHERE (p.estado = 'Publicado' OR p.estado = 'Aprobada') AND p.activo = 1
    ORDER BY p.fecha_publicacion DESC
  `,

  listPendientesPorFamilia: `
    SELECT p.*, u.nombre, u.apellido, u.foto_perfil
    FROM EDI.Publicaciones p
    JOIN EDI.Usuarios u ON u.id_usuario = p.id_usuario
    WHERE p.id_familia = @id_familia AND p.estado = 'Pendiente' AND p.activo = 1
  `,

  listByFamilia: `
    SELECT 
        p.*, 
        u.nombre, u.apellido, u.foto_perfil,
        f.nombre_familia,
        (SELECT COUNT(*) FROM EDI.Publicaciones_Likes pl WHERE pl.id_post = p.id_post) as likes_count,
        (SELECT COUNT(*) FROM EDI.Publicaciones_Comentarios pc WHERE pc.id_post = p.id_post AND pc.activo = 1) as comentarios_count,
        CASE WHEN EXISTS (SELECT 1 FROM EDI.Publicaciones_Likes pl WHERE pl.id_post = p.id_post AND pl.id_usuario = @current_user_id) THEN 1 ELSE 0 END as is_liked
    FROM EDI.Publicaciones p
    JOIN EDI.Usuarios u ON u.id_usuario = p.id_usuario
    LEFT JOIN EDI.Familias_EDI f ON f.id_familia = p.id_familia
    WHERE p.id_familia = @id_familia AND p.activo = 1
      AND (p.estado = 'Publicado' OR p.estado = 'Aprobada')
    ORDER BY p.fecha_publicacion DESC
  `,

  listInstitucional: `
    SELECT p.*, u.nombre, u.apellido
    FROM EDI.Publicaciones p
    JOIN EDI.Usuarios u ON u.id_usuario = p.id_usuario
    WHERE p.id_familia IS NULL AND p.categoria_post = N'Institucional' AND p.activo = 1
    ORDER BY p.fecha_publicacion DESC
  `,
  
  setEstado: `
    UPDATE EDI.Publicaciones
    SET estado = @estado, updated_at = GETDATE()
    WHERE id_post = @id_post;

    SELECT * FROM EDI.Publicaciones WHERE id_post = @id_post;
  `,
  
  softDelete: `UPDATE EDI.Publicaciones SET activo = 0, updated_at = GETDATE() WHERE id_post = @id_post`,
  listByUsuario: `
    SELECT p.*, u.nombre, u.apellido
    FROM EDI.Publicaciones p
    JOIN EDI.Usuarios u ON u.id_usuario = p.id_usuario
    WHERE p.id_usuario = @id_usuario AND p.activo = 1
    ORDER BY p.created_at DESC
  `,
  toggleLike: `
    IF EXISTS (SELECT 1 FROM EDI.Publicaciones_Likes WHERE id_post = @id_post AND id_usuario = @id_usuario)
    BEGIN
        DELETE FROM EDI.Publicaciones_Likes WHERE id_post = @id_post AND id_usuario = @id_usuario;
        SELECT 0 as liked; 
    END
    ELSE
    BEGIN
        INSERT INTO EDI.Publicaciones_Likes (id_post, id_usuario) VALUES (@id_post, @id_usuario);
        SELECT 1 as liked;
    END
  `,
  addComentario: `
    INSERT INTO EDI.Publicaciones_Comentarios (id_post, id_usuario, contenido)
    VALUES (@id_post, @id_usuario, @contenido);
    SELECT SCOPE_IDENTITY() as id_comentario;
  `,
  getComentarios: `
    SELECT c.*, u.nombre, u.apellido, u.foto_perfil
    FROM EDI.Publicaciones_Comentarios c
    JOIN EDI.Usuarios u ON u.id_usuario = c.id_usuario
    WHERE c.id_post = @id_post AND c.activo = 1
    ORDER BY c.created_at ASC
  `,
  listGlobal: `
    SELECT 
        p.*, 
        u.nombre, u.apellido, u.foto_perfil,
        f.nombre_familia,
        (SELECT COUNT(*) FROM EDI.Publicaciones_Likes pl WHERE pl.id_post = p.id_post) as likes_count,
        (SELECT COUNT(*) FROM EDI.Publicaciones_Comentarios pc WHERE pc.id_post = p.id_post AND pc.activo = 1) as comentarios_count,
        CASE WHEN EXISTS (SELECT 1 FROM EDI.Publicaciones_Likes pl WHERE pl.id_post = p.id_post AND pl.id_usuario = @current_user_id) THEN 1 ELSE 0 END as is_liked
    FROM EDI.Publicaciones p
    JOIN EDI.Usuarios u ON u.id_usuario = p.id_usuario
    LEFT JOIN EDI.Familias_EDI f ON f.id_familia = p.id_familia
    WHERE p.activo = 1
      AND (p.estado = 'Publicado' OR p.estado = 'Aprobada')
    ORDER BY p.created_at DESC
  `,
};
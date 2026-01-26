exports.Q = {
  create: `
    INSERT INTO dbo.Mensajes_Chat (id_familia, id_usuario, contenido, activo)
    VALUES (@id_familia, @id_usuario, @mensaje, 1);
    
    SELECT id_mensaje, contenido as mensaje, created_at, id_usuario 
    FROM dbo.Mensajes_Chat 
    WHERE id_mensaje = SCOPE_IDENTITY();
  `,

  listByFamilia: `
    SELECT m.id_mensaje, 
           m.contenido as mensaje, 
           m.created_at, 
           m.id_usuario,
           u.nombre, u.apellido, u.foto_perfil, 
           ISNULL(r.nombre_rol, 'Usuario') as nombre_rol
    FROM dbo.Mensajes_Chat m
    JOIN dbo.Usuarios u ON u.id_usuario = m.id_usuario
    LEFT JOIN dbo.Roles r ON r.id_rol = u.id_rol
    WHERE m.id_familia = @id_familia 
      AND m.activo = 1 -- Solo ocultamos si el MENSAJE fue borrado explícitamente
    ORDER BY m.created_at ASC
  `,

  getFamilyTokens: `
    SELECT u.fcm_token 
    FROM dbo.Usuarios u
    JOIN dbo.Miembros_Familia mf ON mf.id_usuario = u.id_usuario
    WHERE mf.id_familia = @id_familia 
      AND u.id_usuario != @id_sender 
      AND u.activo = 1  -- Solo notificamos a los activos
      AND u.fcm_token IS NOT NULL
  `
};
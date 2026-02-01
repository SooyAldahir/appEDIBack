exports.Q = {
  create: `
    INSERT INTO EDI.Mensajes_Chat (id_familia, id_usuario, contenido, activo)
    VALUES (@id_familia, @id_usuario, @mensaje, 1);
    
    SELECT id_mensaje, contenido as mensaje, created_at, id_usuario 
    FROM EDI.Mensajes_Chat 
    WHERE id_mensaje = SCOPE_IDENTITY();
  `,

  listByFamilia: `
    SELECT m.id_mensaje, 
           m.contenido as mensaje, 
           m.created_at, 
           m.id_usuario,
           u.nombre, u.apellido, u.foto_perfil, 
           ISNULL(r.nombre_rol, 'Usuario') as nombre_rol
    FROM EDI.Mensajes_Chat m
    JOIN EDI.Usuarios u ON u.id_usuario = m.id_usuario
    LEFT JOIN EDI.Roles r ON r.id_rol = u.id_rol
    WHERE m.id_familia = @id_familia 
      AND m.activo = 1 
    ORDER BY m.created_at ASC
  `,

  getFamilyTokens: `
    SELECT u.fcm_token 
    FROM EDI.Usuarios u
    JOIN EDI.Miembros_Familia mf ON mf.id_usuario = u.id_usuario
    WHERE mf.id_familia = @id_familia 
      AND u.id_usuario != @id_sender 
      AND u.activo = 1 
      AND u.fcm_token IS NOT NULL
  `
};
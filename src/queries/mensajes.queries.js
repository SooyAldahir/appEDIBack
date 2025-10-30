exports.Q = {
  send: `
    INSERT INTO dbo.Mensajes_Chat (id_familia, id_usuario, contenido)
    OUTPUT INSERTED.* VALUES (@id_familia, @id_usuario, @contenido)
  `,
  listByFamilia: `
    SELECT m.*, u.nombre, u.apellido
    FROM dbo.Mensajes_Chat m
    JOIN dbo.Usuarios u ON u.id_usuario = m.id_usuario
    WHERE m.id_familia = @id_familia AND m.activo = 1
    ORDER BY m.fecha_envio DESC
  `
};

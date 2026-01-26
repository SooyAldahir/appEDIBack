exports.Q = {
  create: `
    INSERT INTO dbo.Agenda_Actividades (
        titulo, descripcion, fecha_evento, hora_evento, imagen, estado_publicacion, dias_anticipacion
    )
    OUTPUT INSERTED.* VALUES (
        @titulo, @descripcion, @fecha_evento, @hora_evento, @imagen, @estado_publicacion, @dias_anticipacion
    );
  `,

  list: `
    SELECT 
      id_actividad,
      titulo,
      descripcion,
      fecha_evento,
      CONVERT(varchar(5), hora_evento, 108) AS hora_evento,
      imagen,
      estado_publicacion,
      fecha_creacion,
      updated_at,
      activo
    FROM dbo.Agenda_Actividades
    WHERE (@estado IS NULL OR estado_publicacion = @estado)
      AND (@desde IS NULL OR fecha_evento >= @desde)
      AND (@hasta IS NULL OR fecha_evento <= @hasta)
      AND activo = 1
    ORDER BY fecha_evento DESC, id_actividad DESC
  `,

  update: `
    UPDATE dbo.Agenda_Actividades SET
      titulo             = ISNULL(NULLIF(@titulo, ''), titulo),
      descripcion        = ISNULL(NULLIF(@descripcion, ''), descripcion),
      fecha_evento       = ISNULL(@fecha_evento, fecha_evento),
      hora_evento        = @hora_evento,
      imagen             = ISNULL(@imagen, imagen), 
      estado_publicacion = ISNULL(@estado_publicacion, estado_publicacion),
      dias_anticipacion  = ISNULL(@dias_anticipacion, dias_anticipacion),
      updated_at         = GETDATE()
    OUTPUT INSERTED.* WHERE id_actividad = @id_actividad
  `,

  remove: `UPDATE dbo.Agenda_Actividades SET activo = 0, updated_at = GETDATE() WHERE id_actividad = @id_actividad`,
  getActiveEvents: `
    SELECT 
        id_actividad as id_evento, 
        titulo, 
        descripcion as mensaje,
        fecha_evento,
        CONVERT(varchar(5), hora_evento, 108) AS hora_evento,
        dias_anticipacion,
        imagen,  
        'EVENTO' as tipo,       
        'Admin' as nombre_rol,
        'Administración' as nombre,
        NULL as foto_perfil,
        0 as likes_count,
        0 as comentarios_count,
        0 as is_liked
    FROM dbo.Agenda_Actividades
    WHERE activo = 1
      AND estado_publicacion = 'Publicada'
      AND CAST(GETDATE() AS DATE) >= DATEADD(DAY, -dias_anticipacion, fecha_evento)
      AND CAST(GETDATE() AS DATE) <= fecha_evento
    ORDER BY fecha_evento ASC
  `
};
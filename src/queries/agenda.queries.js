exports.Q = {
  create: `
    INSERT INTO dbo.Agenda_Actividades (titulo, descripcion, fecha_evento, hora_evento, imagen, estado_publicacion)
    OUTPUT INSERTED.* VALUES (@titulo, @descripcion, @fecha_evento, @hora_evento, @imagen, @estado_publicacion)
  `,
  list: `
    SELECT 
      id_actividad,
      titulo,
      descripcion,
      fecha_evento,
      -- Usamos CONVERT en lugar de FORMAT. Estilo 108 (HH:MM:SS) y lo cortamos a 5 chars (HH:MM)
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
      titulo = ISNULL(@titulo,titulo),
      descripcion = ISNULL(@descripcion,descripcion),
      fecha_evento = ISNULL(@fecha_evento,fecha_evento),
      hora_evento = @hora_evento,
      imagen = @imagen,
      estado_publicacion = ISNULL(@estado_publicacion,estado_publicacion),
      updated_at = GETDATE()
    OUTPUT INSERTED.* WHERE id_actividad = @id_actividad
  `,
  remove: `UPDATE dbo.Agenda_Actividades SET activo = 0, updated_at = GETDATE() WHERE id_actividad = @id_actividad`
};

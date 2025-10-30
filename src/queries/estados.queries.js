exports.Q = {
  // cierra vigentes del usuario (opcional, para tener uno activo)
  closePrevActives: `
    UPDATE dbo.Estados_Alumno
    SET activo = 0, fecha_fin = GETDATE(), updated_at = GETDATE()
    WHERE id_usuario = @id_usuario AND activo = 1
  `,
  create: `
    INSERT INTO dbo.Estados_Alumno (id_usuario, tipo_estado, fecha_inicio, fecha_fin, activo)
    OUTPUT INSERTED.* VALUES (@id_usuario, @tipo_estado, ISNULL(@fecha_inicio, GETDATE()), @fecha_fin, @activo)
  `,
  listByUsuario: `SELECT * FROM dbo.Estados_Alumno WHERE id_usuario = @id_usuario ORDER BY fecha_inicio DESC`,
  close: `
    UPDATE dbo.Estados_Alumno SET activo = 0, fecha_fin = GETDATE(), updated_at = GETDATE()
    OUTPUT INSERTED.* WHERE id_estado = @id_estado
  `
};

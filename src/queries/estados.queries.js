// src/queries/estados.queries.js
exports.Q = {
  getCatalog: `SELECT id_cat_estado, descripcion, color FROM dbo.Cat_Estados WHERE activo = 1`,

  closePrevActives: `
    UPDATE dbo.Estados_Alumno
    SET activo = 0, fecha_fin = GETDATE(), updated_at = GETDATE()
    WHERE id_usuario = @id_usuario AND activo = 1
  `,
  
  // ASEGÚRATE DE QUE ESTA LÍNEA TENGA 'id_cat_estado'
  create: `
    INSERT INTO dbo.Estados_Alumno (id_usuario, id_cat_estado, tipo_estado, fecha_inicio, fecha_fin, activo)
    OUTPUT INSERTED.* VALUES (@id_usuario, @id_cat_estado, @tipo_estado, ISNULL(@fecha_inicio, GETDATE()), @fecha_fin, @activo)
  `,
  
  listByUsuario: `
    SELECT EA.*, CE.descripcion as nombre_estado 
    FROM dbo.Estados_Alumno EA
    LEFT JOIN dbo.Cat_Estados CE ON EA.id_cat_estado = CE.id_cat_estado
    WHERE EA.id_usuario = @id_usuario 
    ORDER BY EA.fecha_inicio DESC
  `,
  
  close: `
    UPDATE dbo.Estados_Alumno SET activo = 0, fecha_fin = GETDATE(), updated_at = GETDATE()
    OUTPUT INSERTED.* WHERE id_estado = @id_estado
  `,
  updateUserStatus: `
    UPDATE dbo.Usuarios 
    SET estado = @estado, updated_at = GETDATE()
    WHERE id_usuario = @id_usuario
  `
};
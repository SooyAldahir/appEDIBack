exports.Q = {
  add: `
    INSERT INTO dbo.Miembros_Familia (id_familia, id_usuario, tipo_miembro)
    OUTPUT INSERTED.* VALUES (@id_familia, @id_usuario, @tipo_miembro)
  `,
  listByFamilia: `
    SELECT 
      mf.*, 
      u.nombre, u.apellido, u.tipo_usuario, 
      u.matricula, u.num_empleado,
      u.fecha_nacimiento, u.telefono, u.carrera 
    FROM dbo.Miembros_Familia mf
    JOIN dbo.Usuarios u ON u.id_usuario = mf.id_usuario
    WHERE mf.id_familia = @id_familia AND mf.activo = 1
  `,
  remove: `UPDATE dbo.Miembros_Familia SET activo = 0, updated_at = GETDATE() WHERE id_miembro = @id_miembro`
};

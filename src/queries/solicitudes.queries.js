exports.Q = {
  create: `
    INSERT INTO EDI.Solicitudes_Familia (id_familia, id_usuario, tipo_solicitud)
    OUTPUT INSERTED.* VALUES (@id_familia, @id_usuario, @tipo_solicitud)
  `,
  listByFamilia: `
    SELECT s.*, u.nombre, u.apellido
    FROM EDI.Solicitudes_Familia s
    JOIN EDI.Usuarios u ON u.id_usuario = s.id_usuario
    WHERE s.id_familia = @id_familia AND s.activo = 1
    ORDER BY s.fecha_solicitud DESC
  `,
  setEstado: `
    UPDATE EDI.Solicitudes_Familia
    SET estado = @estado, fecha_respuesta = GETDATE(), updated_at = GETDATE()
    OUTPUT INSERTED.* WHERE id_solicitud = @id_solicitud
  `
};

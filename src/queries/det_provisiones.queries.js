exports.Q = {
  upsert: `
    MERGE dbo.Detalle_Provision AS tgt
    USING (SELECT @id_provision AS id_provision, @id_usuario AS id_usuario) AS src
      ON tgt.id_provision = src.id_provision AND tgt.id_usuario = src.id_usuario
    WHEN MATCHED THEN UPDATE SET asistio = @asistio, updated_at = GETDATE()
    WHEN NOT MATCHED THEN INSERT (id_provision, id_usuario, asistio) VALUES (@id_provision, @id_usuario, @asistio)
    OUTPUT inserted.*;
  `,
  listByProvision: `
    SELECT d.*, u.nombre, u.apellido
    FROM dbo.Detalle_Provision d
    JOIN dbo.Usuarios u ON u.id_usuario = d.id_usuario
    WHERE d.id_provision = @id_provision
    ORDER BY u.nombre
  `
};

// queries/familias.queries.js
exports.Q = {
  // SELECT base con JOIN a Usuarios para traer los nombres
  base: `
    SELECT
      f.id_familia,
      f.nombre_familia,
      f.residencia,
      f.papa_id,
      f.mama_id,
      f.direccion,
      -- nombres completos (si existen)
      (p.nombre + ' ' + p.apellido) AS papa_nombre,
      (m.nombre + ' ' + m.apellido) AS mama_nombre
    FROM dbo.Familias_EDI AS f
    LEFT JOIN dbo.Usuarios AS p ON p.id_usuario = f.papa_id
    LEFT JOIN dbo.Usuarios AS m ON m.id_usuario = f.mama_id
  `,

  list: `
    {{BASE}}
    WHERE f.activo = 1
    ORDER BY f.nombre_familia
  `,

  byId: `
    {{BASE}}
    WHERE f.id_familia = @id_familia AND f.activo = 1
  `,

  insert: `
    INSERT INTO dbo.Familias_EDI (nombre_familia, residencia, direccion, papa_id, mama_id)
    VALUES (@nombre_familia, @residencia, @direccion, @papa_id, @mama_id);

    SELECT CAST(SCOPE_IDENTITY() AS INT) AS id_familia;
  `,

  update: `
    UPDATE dbo.Familias_EDI
    SET
      nombre_familia = COALESCE(@nombre_familia, nombre_familia),
      residencia     = COALESCE(@residencia, residencia),
      direccion      = COALESCE(@direccion, direccion),
      papa_id        = COALESCE(@papa_id, papa_id),
      mama_id        = COALESCE(@mama_id, mama_id)
    WHERE id_familia = @id_familia AND activo = 1;

    SELECT @@ROWCOUNT AS affected;
  `,

  softDelete: `
    UPDATE dbo.Familias_EDI SET activo = 0 WHERE id_familia = @id_familia
  `,

  byIdent: `
    {{BASE}}
    JOIN dbo.Miembros_Familia mf ON mf.id_familia = f.id_familia
    JOIN dbo.Usuarios u          ON u.id_usuario = mf.id_usuario
    WHERE (u.matricula = @ident OR u.num_empleado = @ident)
      AND f.activo = 1
  `,

  // búsqueda por nombre (lo usas en /search?name=)
  byName: `
    {{BASE}}
    WHERE f.nombre_familia LIKE @like
    ORDER BY f.nombre_familia
  `,
};

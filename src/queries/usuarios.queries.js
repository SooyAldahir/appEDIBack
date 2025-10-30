exports.Q = {
  byLogin: `
    SELECT TOP 1 u.*, r.nombre_rol
    FROM dbo.Usuarios u
    JOIN dbo.Roles r ON r.id_rol = u.id_rol
    WHERE u.correo = @Login
       OR (TRY_CONVERT(INT, @Login) IS NOT NULL AND u.matricula = TRY_CONVERT(INT, @Login))
       OR (TRY_CONVERT(INT, @Login) IS NOT NULL AND u.num_empleado = TRY_CONVERT(INT, @Login))
  `,
  insert: `
    DECLARE @out TABLE (
      id_usuario        INT,
      nombre            NVARCHAR(100),
      apellido          NVARCHAR(100),
      tipo_usuario      NVARCHAR(50),
      matricula         INT,
      num_empleado      INT,
      correo            NVARCHAR(255),
      estado            NVARCHAR(50),
      created_at        DATETIME,
      updated_at        DATETIME,
      telefono          NVARCHAR(20),
      residencia        NVARCHAR(50),
      direccion         NVARCHAR(200),
      fecha_nacimiento  DATE,
      carrera           NVARCHAR(120)
    );

    INSERT INTO dbo.Usuarios
    (
      nombre, apellido, correo, contrasena, foto_perfil, tipo_usuario,
      matricula, num_empleado, id_rol,
      telefono, residencia, direccion, fecha_nacimiento, carrera
    )
    OUTPUT
      INSERTED.id_usuario,
      INSERTED.nombre,
      INSERTED.apellido,
      INSERTED.tipo_usuario,
      INSERTED.matricula,
      INSERTED.num_empleado,
      INSERTED.correo,
      INSERTED.estado,
      INSERTED.created_at,
      INSERTED.updated_at,
      INSERTED.telefono,
      INSERTED.residencia,
      INSERTED.direccion,
      INSERTED.fecha_nacimiento,
      INSERTED.carrera
    INTO @out
    VALUES
    (
      @nombre, @apellido, @correo, @contrasena, @foto_perfil, @tipo_usuario,
      @matricula, @num_empleado, @id_rol,
      @telefono, @residencia, @direccion, @fecha_nacimiento, @carrera
    );

    SELECT * FROM @out;
  `,
  updateBasic: `
    DECLARE @out TABLE (
      id_usuario        INT,
      nombre            NVARCHAR(100),
      apellido          NVARCHAR(100),
      tipo_usuario      NVARCHAR(50),
      matricula         INT,
      num_empleado      INT,
      correo            NVARCHAR(255),
      estado            NVARCHAR(50),
      updated_at        DATETIME,
      telefono          NVARCHAR(20),
      residencia        NVARCHAR(50),
      direccion         NVARCHAR(200),
      fecha_nacimiento  DATE,
      carrera           NVARCHAR(120)
    );

    UPDATE dbo.Usuarios
    SET
      nombre            = COALESCE(@nombre, nombre),
      apellido          = COALESCE(@apellido, apellido),
      foto_perfil       = COALESCE(@foto_perfil, foto_perfil),
      estado            = COALESCE(@estado, estado),
      activo            = COALESCE(@activo, activo),
      telefono          = COALESCE(@telefono, telefono),
      residencia        = COALESCE(@residencia, residencia),
      direccion         = COALESCE(@direccion, direccion),
      fecha_nacimiento  = COALESCE(@fecha_nacimiento, fecha_nacimiento),
      carrera           = COALESCE(@carrera, carrera),
      updated_at        = GETDATE()
    OUTPUT
      INSERTED.id_usuario,
      INSERTED.nombre,
      INSERTED.apellido,
      INSERTED.tipo_usuario,
      INSERTED.matricula,
      INSERTED.num_empleado,
      INSERTED.correo,
      INSERTED.estado,
      INSERTED.updated_at,
      INSERTED.telefono,
      INSERTED.residencia,
      INSERTED.direccion,
      INSERTED.fecha_nacimiento,
      INSERTED.carrera
    INTO @out
    WHERE id_usuario = @id_usuario;

    SELECT * FROM @out;
  `,

  list: `SELECT u.id_usuario,u.nombre,u.apellido,u.correo,u.tipo_usuario,u.matricula,u.num_empleado,u.estado,u.activo,r.nombre_rol
         FROM dbo.Usuarios u JOIN dbo.Roles r ON r.id_rol = u.id_rol`,
  byId: `SELECT u.*, r.nombre_rol FROM dbo.Usuarios u JOIN dbo.Roles r ON r.id_rol = u.id_rol WHERE id_usuario = @id_usuario`,
  softDelete: `UPDATE dbo.Usuarios SET activo = 0, updated_at = GETDATE() WHERE id_usuario = @id_usuario`,
  setToken: `UPDATE dbo.Usuarios SET session_token = @token, updated_at = GETDATE() WHERE id_usuario = @id_usuario`,
  clearToken: `UPDATE dbo.Usuarios SET session_token = NULL, updated_at = GETDATE() WHERE session_token = @token`
};

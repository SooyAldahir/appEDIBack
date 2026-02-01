CREATE DATABASE Edi301
GO

USE [Edi301]
GO

-- 1. CREACIÓN DEL ESQUEMA
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'EDI')
BEGIN
    EXEC('CREATE SCHEMA [EDI]')
END
GO

-- 2. DEFINICIÓN DE TABLAS (SCHEMA EDI)

CREATE TABLE [EDI].[Roles](
	[id_rol] [int] IDENTITY(1,1) NOT NULL,
	[nombre_rol] [nvarchar](50) NOT NULL,
	[descripcion] [nvarchar](200) NULL,
	[created_at] [datetime] DEFAULT (getdate()) NOT NULL,
	[updated_at] [datetime] NULL,
	[activo] [bit] DEFAULT ((1)) NOT NULL,
PRIMARY KEY CLUSTERED ([id_rol] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [EDI].[Cat_Estados](
	[id_cat_estado] [int] IDENTITY(1,1) NOT NULL,
	[descripcion] [nvarchar](50) NOT NULL,
	[activo] [bit] DEFAULT ((1)) NULL,
	[color] [nvarchar](20) DEFAULT ('#13436B') NULL,
PRIMARY KEY CLUSTERED ([id_cat_estado] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [EDI].[Usuarios](
	[id_usuario] [int] IDENTITY(1,1) NOT NULL,
	[nombre] [nvarchar](100) NOT NULL,
	[apellido] [nvarchar](100) NOT NULL,
	[correo] [nvarchar](150) NOT NULL,
	[contrasena] [nvarchar](255) NOT NULL,
	[foto_perfil] [nvarchar](255) NULL,
	[estado] [nvarchar](50) DEFAULT (N'Activo') NOT NULL,
	[id_rol] [int] NOT NULL,
	[session_token] [nvarchar](255) NULL,
	[created_at] [datetime] DEFAULT (getdate()) NOT NULL,
	[updated_at] [datetime] NULL,
	[activo] [bit] DEFAULT ((1)) NOT NULL,
	[tipo_usuario] [nvarchar](20) DEFAULT (N'ALUMNO') NOT NULL,
	[matricula] [int] NULL,
	[num_empleado] [int] NULL,
	[carrera] [nvarchar](120) NULL,
	[fecha_nacimiento] [date] NULL,
	[telefono] [nvarchar](25) NULL,
	[direccion] [nvarchar](250) NULL,
	[residencia] [nvarchar](50) NULL,
	[fcm_token] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED ([id_usuario] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [EDI].[Familias_EDI](
	[id_familia] [int] IDENTITY(1,1) NOT NULL,
	[nombre_familia] [nvarchar](100) NOT NULL,
	[descripcion] [nvarchar](255) NULL,
	[papa_id] [int] NULL,
	[mama_id] [int] NULL,
	[fecha_creacion] [datetime] DEFAULT (getdate()) NOT NULL,
	[created_at] [datetime] DEFAULT (getdate()) NOT NULL,
	[updated_at] [datetime] NULL,
	[activo] [bit] DEFAULT ((1)) NOT NULL,
	[residencia] [nvarchar](250) NOT NULL,
	[direccion] [nvarchar](200) NULL,
	[foto_portada_url] [nvarchar](max) NULL,
	[foto_perfil_url] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED ([id_familia] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [EDI].[Miembros_Familia](
	[id_miembro] [int] IDENTITY(1,1) NOT NULL,
	[id_familia] [int] NOT NULL,
	[id_usuario] [int] NOT NULL,
	[tipo_miembro] [nvarchar](50) NOT NULL,
	[fecha_ingreso] [datetime] DEFAULT (getdate()) NOT NULL,
	[created_at] [datetime] DEFAULT (getdate()) NOT NULL,
	[updated_at] [datetime] NULL,
	[activo] [bit] DEFAULT ((1)) NOT NULL,
PRIMARY KEY CLUSTERED ([id_miembro] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [EDI].[Publicaciones](
	[id_post] [int] IDENTITY(1,1) NOT NULL,
	[id_familia] [int] NULL,
	[id_usuario] [int] NOT NULL,
	[categoria_post] [nvarchar](50) NOT NULL,
	[mensaje] [nvarchar](500) NULL,
	[fecha_publicacion] [datetime] DEFAULT (getdate()) NOT NULL,
	[estado] [nvarchar](50) DEFAULT (N'Pendiente') NOT NULL,
	[created_at] [datetime] DEFAULT (getdate()) NOT NULL,
	[updated_at] [datetime] NULL,
	[activo] [bit] DEFAULT ((1)) NOT NULL,
	[url_imagen] [nvarchar](max) NULL,
	[tipo] [nvarchar](20) DEFAULT ('POST') NOT NULL,
	[id_aprobador] [int] NULL,
	[fecha_aprobacion] [datetime] NULL,
PRIMARY KEY CLUSTERED ([id_post] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [EDI].[Agenda_Actividades](
	[id_actividad] [int] IDENTITY(1,1) NOT NULL,
	[titulo] [nvarchar](150) NOT NULL,
	[descripcion] [nvarchar](500) NULL,
	[fecha_evento] [date] NOT NULL,
	[hora_evento] [time](7) NULL,
	[imagen] [nvarchar](255) NULL,
	[estado_publicacion] [nvarchar](50) DEFAULT (N'Programada') NOT NULL,
	[fecha_creacion] [datetime] DEFAULT (getdate()) NOT NULL,
	[created_at] [datetime] DEFAULT (getdate()) NOT NULL,
	[updated_at] [datetime] NULL,
	[activo] [bit] DEFAULT ((1)) NOT NULL,
	[notificacion_enviada] [bit] DEFAULT ((0)) NULL,
    [dias_anticipacion] [int] DEFAULT 3 NOT NULL,
PRIMARY KEY CLUSTERED ([id_actividad] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [EDI].[Provisiones_Alimento](
	[id_provision] [int] IDENTITY(1,1) NOT NULL,
	[id_familia] [int] NOT NULL,
	[fecha] [date] NOT NULL,
	[cantidad_cenas] [int] NOT NULL,
	[comentario] [nvarchar](255) NULL,
	[created_at] [datetime] DEFAULT (getdate()) NOT NULL,
	[updated_at] [datetime] NULL,
	[activo] [bit] DEFAULT ((1)) NOT NULL,
PRIMARY KEY CLUSTERED ([id_provision] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [EDI].[Detalle_Provision](
	[id_detalle] [int] IDENTITY(1,1) NOT NULL,
	[id_provision] [int] NOT NULL,
	[id_usuario] [int] NOT NULL,
	[asistio] [bit] DEFAULT ((0)) NOT NULL,
	[created_at] [datetime] DEFAULT (getdate()) NOT NULL,
	[updated_at] [datetime] NULL,
PRIMARY KEY CLUSTERED ([id_detalle] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [EDI].[Estados_Alumno](
	[id_estado] [int] IDENTITY(1,1) NOT NULL,
	[id_usuario] [int] NOT NULL,
	[tipo_estado] [nvarchar](50) NOT NULL,
	[fecha_inicio] [datetime] DEFAULT (getdate()) NOT NULL,
	[fecha_fin] [datetime] NULL,
	[activo] [bit] DEFAULT ((1)) NOT NULL,
	[created_at] [datetime] DEFAULT (getdate()) NOT NULL,
	[updated_at] [datetime] NULL,
	[id_cat_estado] [int] NULL,
PRIMARY KEY CLUSTERED ([id_estado] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [EDI].[Fotos_Publicacion](
	[id_foto] [int] IDENTITY(1,1) NOT NULL,
	[id_post] [int] NOT NULL,
	[url_foto] [nvarchar](255) NOT NULL,
	[created_at] [datetime] DEFAULT (getdate()) NOT NULL,
	[updated_at] [datetime] NULL,
PRIMARY KEY CLUSTERED ([id_foto] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [EDI].[Notificaciones](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[id_usuario_destino] [int] NOT NULL,
	[titulo] [nvarchar](100) NULL,
	[cuerpo] [nvarchar](255) NULL,
	[tipo] [nvarchar](50) NULL,
	[id_referencia] [int] NULL,
	[leido] [bit] DEFAULT ((0)) NULL,
	[fecha_creacion] [datetime] DEFAULT (getdate()) NULL,
PRIMARY KEY CLUSTERED ([id] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [EDI].[Solicitudes_Familia](
	[id_solicitud] [int] IDENTITY(1,1) NOT NULL,
	[id_familia] [int] NOT NULL,
	[id_usuario] [int] NOT NULL,
	[tipo_solicitud] [nvarchar](50) NOT NULL,
	[estado] [nvarchar](50) DEFAULT (N'Pendiente') NOT NULL,
	[fecha_solicitud] [datetime] DEFAULT (getdate()) NOT NULL,
	[fecha_respuesta] [datetime] NULL,
	[created_at] [datetime] DEFAULT (getdate()) NOT NULL,
	[updated_at] [datetime] NULL,
	[activo] [bit] DEFAULT ((1)) NOT NULL,
PRIMARY KEY CLUSTERED ([id_solicitud] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [EDI].[Mensajes_Chat](
	[id_mensaje] [int] IDENTITY(1,1) NOT NULL,
	[id_familia] [int] NOT NULL,
	[id_usuario] [int] NOT NULL,
	[contenido] [nvarchar](500) NOT NULL,
	[fecha_envio] [datetime] DEFAULT (getdate()) NOT NULL,
	[created_at] [datetime] DEFAULT (getdate()) NOT NULL,
	[updated_at] [datetime] NULL,
	[activo] [bit] DEFAULT ((1)) NOT NULL,
PRIMARY KEY CLUSTERED ([id_mensaje] ASC)
) ON [PRIMARY]
GO

CREATE TABLE [EDI].[Publicaciones_Likes] (
    id_like INT IDENTITY(1,1) PRIMARY KEY,
    id_post INT NOT NULL,
    id_usuario INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);
GO

CREATE TABLE [EDI].[Publicaciones_Comentarios] (
    id_comentario INT IDENTITY(1,1) PRIMARY KEY,
    id_post INT NOT NULL,
    id_usuario INT NOT NULL,
    contenido NVARCHAR(500) NOT NULL,
    activo BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE()
);
GO

CREATE TABLE [EDI].[Chat_Salas](
	[id_sala] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[nombre] [nvarchar](100) NULL, 
	[tipo] [nvarchar](20) NOT NULL,
	[created_at] [datetime] DEFAULT GETDATE(),
	[activo] [bit] DEFAULT 1
);
GO

CREATE TABLE [EDI].[Chat_Participantes](
	[id_participante] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[id_sala] [int] NOT NULL,
	[id_usuario] [int] NOT NULL, 
	[es_admin] [bit] DEFAULT 0,  
	[joined_at] [datetime] DEFAULT GETDATE()
);
GO

CREATE TABLE [EDI].[Chat_Mensajes](
	[id_mensaje] [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
	[id_sala] [int] NOT NULL,
	[id_usuario] [int] NOT NULL, 
	[mensaje] [nvarchar](max) NOT NULL,
	[tipo_mensaje] [nvarchar](20) DEFAULT 'TEXTO', 
	[leido] [bit] DEFAULT 0, 
	[created_at] [datetime] DEFAULT GETDATE()
);
GO


-- 3. RELACIONES 
ALTER TABLE [EDI].[Detalle_Provision]  WITH CHECK ADD  CONSTRAINT [FK_DetProv_Prov] FOREIGN KEY([id_provision]) REFERENCES [EDI].[Provisiones_Alimento] ([id_provision])
ALTER TABLE [EDI].[Detalle_Provision]  WITH CHECK ADD  CONSTRAINT [FK_DetProv_Usu] FOREIGN KEY([id_usuario]) REFERENCES [EDI].[Usuarios] ([id_usuario])
ALTER TABLE [EDI].[Estados_Alumno]  WITH CHECK ADD  CONSTRAINT [FK_Estados_Alumno_Cat] FOREIGN KEY([id_cat_estado]) REFERENCES [EDI].[Cat_Estados] ([id_cat_estado])
ALTER TABLE [EDI].[Estados_Alumno]  WITH CHECK ADD  CONSTRAINT [FK_Estados_Usuario] FOREIGN KEY([id_usuario]) REFERENCES [EDI].[Usuarios] ([id_usuario])
ALTER TABLE [EDI].[Familias_EDI]  WITH CHECK ADD  CONSTRAINT [FK_Familias_Mama] FOREIGN KEY([mama_id]) REFERENCES [EDI].[Usuarios] ([id_usuario])
ALTER TABLE [EDI].[Familias_EDI]  WITH CHECK ADD  CONSTRAINT [FK_Familias_Papa] FOREIGN KEY([papa_id]) REFERENCES [EDI].[Usuarios] ([id_usuario])
ALTER TABLE [EDI].[Fotos_Publicacion]  WITH CHECK ADD  CONSTRAINT [FK_Fotos_Publicacion] FOREIGN KEY([id_post]) REFERENCES [EDI].[Publicaciones] ([id_post])
ALTER TABLE [EDI].[Mensajes_Chat]  WITH CHECK ADD  CONSTRAINT [FK_Msg_Familia] FOREIGN KEY([id_familia]) REFERENCES [EDI].[Familias_EDI] ([id_familia])
ALTER TABLE [EDI].[Mensajes_Chat]  WITH CHECK ADD  CONSTRAINT [FK_Msg_Usuario] FOREIGN KEY([id_usuario]) REFERENCES [EDI].[Usuarios] ([id_usuario])
ALTER TABLE [EDI].[Miembros_Familia]  WITH CHECK ADD  CONSTRAINT [FK_Miembros_Familia] FOREIGN KEY([id_familia]) REFERENCES [EDI].[Familias_EDI] ([id_familia])
ALTER TABLE [EDI].[Miembros_Familia]  WITH CHECK ADD  CONSTRAINT [FK_Miembros_Usuario] FOREIGN KEY([id_usuario]) REFERENCES [EDI].[Usuarios] ([id_usuario])
ALTER TABLE [EDI].[Notificaciones]  WITH CHECK ADD  CONSTRAINT [FK_Notificaciones_Usuario] FOREIGN KEY([id_usuario_destino]) REFERENCES [EDI].[Usuarios] ([id_usuario])
ALTER TABLE [EDI].[Provisiones_Alimento]  WITH CHECK ADD  CONSTRAINT [FK_Prov_Familia] FOREIGN KEY([id_familia]) REFERENCES [EDI].[Familias_EDI] ([id_familia])
ALTER TABLE [EDI].[Publicaciones]  WITH CHECK ADD  CONSTRAINT [FK_Publicaciones_Familia] FOREIGN KEY([id_familia]) REFERENCES [EDI].[Familias_EDI] ([id_familia])
ALTER TABLE [EDI].[Publicaciones]  WITH CHECK ADD  CONSTRAINT [FK_Publicaciones_Usuario] FOREIGN KEY([id_usuario]) REFERENCES [EDI].[Usuarios] ([id_usuario])
ALTER TABLE [EDI].[Solicitudes_Familia]  WITH CHECK ADD  CONSTRAINT [FK_Solicitudes_Familia] FOREIGN KEY([id_familia]) REFERENCES [EDI].[Familias_EDI] ([id_familia])
ALTER TABLE [EDI].[Solicitudes_Familia]  WITH CHECK ADD  CONSTRAINT [FK_Solicitudes_Usuario] FOREIGN KEY([id_usuario]) REFERENCES [EDI].[Usuarios] ([id_usuario])
ALTER TABLE [EDI].[Usuarios]  WITH CHECK ADD  CONSTRAINT [FK_Usuarios_Roles] FOREIGN KEY([id_rol]) REFERENCES [EDI].[Roles] ([id_rol])

-- FKs Nuevas Tablas
ALTER TABLE [EDI].[Publicaciones_Likes] WITH CHECK ADD FOREIGN KEY ([id_post]) REFERENCES [EDI].[Publicaciones](id_post)
ALTER TABLE [EDI].[Publicaciones_Likes] WITH CHECK ADD FOREIGN KEY ([id_usuario]) REFERENCES [EDI].[Usuarios](id_usuario)
ALTER TABLE [EDI].[Publicaciones_Comentarios] WITH CHECK ADD FOREIGN KEY ([id_post]) REFERENCES [EDI].[Publicaciones](id_post)
ALTER TABLE [EDI].[Publicaciones_Comentarios] WITH CHECK ADD FOREIGN KEY ([id_usuario]) REFERENCES [EDI].[Usuarios](id_usuario)
ALTER TABLE [EDI].[Chat_Participantes] WITH CHECK ADD FOREIGN KEY ([id_sala]) REFERENCES [EDI].[Chat_Salas](id_sala)
ALTER TABLE [EDI].[Chat_Participantes] WITH CHECK ADD FOREIGN KEY ([id_usuario]) REFERENCES [EDI].[Usuarios](id_usuario)
ALTER TABLE [EDI].[Chat_Mensajes] WITH CHECK ADD FOREIGN KEY ([id_sala]) REFERENCES [EDI].[Chat_Salas](id_sala)
ALTER TABLE [EDI].[Chat_Mensajes] WITH CHECK ADD FOREIGN KEY ([id_usuario]) REFERENCES [EDI].[Usuarios](id_usuario)

-- 4. VALIDACIONES
ALTER TABLE [EDI].[Agenda_Actividades]  WITH CHECK ADD  CONSTRAINT [CK_Agenda_Activo] CHECK  (([activo]=(1) OR [activo]=(0)))
ALTER TABLE [EDI].[Agenda_Actividades]  WITH CHECK ADD  CONSTRAINT [CK_Agenda_Estado] CHECK  (([estado_publicacion]=N'Finalizada' OR [estado_publicacion]=N'Publicada' OR [estado_publicacion]=N'Programada'))
ALTER TABLE [EDI].[Detalle_Provision]  WITH CHECK ADD  CONSTRAINT [CK_DetProv_Asistio] CHECK  (([asistio]=(1) OR [asistio]=(0)))
ALTER TABLE [EDI].[Estados_Alumno]  WITH CHECK ADD  CONSTRAINT [CK_Estados_Activo] CHECK  (([activo]=(1) OR [activo]=(0)))
ALTER TABLE [EDI].[Familias_EDI]  WITH CHECK ADD  CONSTRAINT [CK_Familias_Activo] CHECK  (([activo]=(1) OR [activo]=(0)))
ALTER TABLE [EDI].[Familias_EDI]  WITH CHECK ADD  CONSTRAINT [CK_FamiliasEDI_DireccionExterna] CHECK  (([residencia]=N'Externa' AND [direccion] IS NOT NULL AND ltrim(rtrim([direccion]))<>N'' OR [residencia]=N'Interna' AND ([direccion] IS NULL OR ltrim(rtrim([direccion]))=N'')))
ALTER TABLE [EDI].[Familias_EDI]  WITH CHECK ADD  CONSTRAINT [CK_FamiliasEDI_Residencia] CHECK  (([residencia]=N'Externa' OR [residencia]=N'Interna'))
ALTER TABLE [EDI].[Mensajes_Chat]  WITH CHECK ADD  CONSTRAINT [CK_Msg_Activo] CHECK  (([activo]=(1) OR [activo]=(0)))
ALTER TABLE [EDI].[Miembros_Familia]  WITH CHECK ADD  CONSTRAINT [CK_Miembros_Activo] CHECK  (([activo]=(1) OR [activo]=(0)))
ALTER TABLE [EDI].[Provisiones_Alimento]  WITH CHECK ADD  CONSTRAINT [CK_Prov_Activo] CHECK  (([activo]=(1) OR [activo]=(0)))
ALTER TABLE [EDI].[Publicaciones]  WITH CHECK ADD  CONSTRAINT [CK_Publicaciones_Activo] CHECK  (([activo]=(1) OR [activo]=(0)))
ALTER TABLE [EDI].[Publicaciones]  WITH CHECK ADD  CONSTRAINT [CK_Publicaciones_Categoria] CHECK  (([categoria_post]=N'Institucional' OR [categoria_post]=N'Familiar'))
ALTER TABLE [EDI].[Publicaciones]  WITH CHECK ADD  CONSTRAINT [CK_Publicaciones_Estado] CHECK  (([estado]=N'Rechazada' OR [estado]=N'Aprobada' OR [estado]=N'Pendiente' OR [estado]=N'Publicado'))
ALTER TABLE [EDI].[Roles]  WITH CHECK ADD  CONSTRAINT [CK_Roles_Activo] CHECK  (([activo]=(1) OR [activo]=(0)))
ALTER TABLE [EDI].[Roles]  WITH CHECK ADD  CONSTRAINT [CK_Roles_NombreRol] CHECK  (([nombre_rol]=N'HijoSanguineo' OR [nombre_rol]=N'HijoEDI' OR [nombre_rol]=N'MamaEDI' OR [nombre_rol]=N'PapaEDI' OR [nombre_rol]=N'Admin'))
ALTER TABLE [EDI].[Solicitudes_Familia]  WITH CHECK ADD  CONSTRAINT [CK_Solicitudes_Activo] CHECK  (([activo]=(1) OR [activo]=(0)))
ALTER TABLE [EDI].[Solicitudes_Familia]  WITH CHECK ADD  CONSTRAINT [CK_Solicitudes_Estado] CHECK  (([estado]=N'Rechazada' OR [estado]=N'Aceptada' OR [estado]=N'Pendiente'))
ALTER TABLE [EDI].[Solicitudes_Familia]  WITH CHECK ADD  CONSTRAINT [CK_Solicitudes_Tipo] CHECK  (([tipo_solicitud]=N'Invitación' OR [tipo_solicitud]=N'Solicitud'))
ALTER TABLE [EDI].[Usuarios]  WITH CHECK ADD  CONSTRAINT [CK_Usuarios_Activo] CHECK  (([activo]=(1) OR [activo]=(0)))
ALTER TABLE [EDI].[Usuarios]  WITH CHECK ADD  CONSTRAINT [CK_Usuarios_CorreoFormato] CHECK  (([correo] like N'%_@_%._%'))
ALTER TABLE [EDI].[Usuarios]  WITH CHECK ADD  CONSTRAINT [CK_Usuarios_DireccionResidencia_v2] CHECK  (([residencia]='Interna' AND [direccion] IS NULL OR [residencia]='Externa' AND [direccion] IS NOT NULL OR [residencia] IS NULL))
ALTER TABLE [EDI].[Usuarios]  WITH CHECK ADD  CONSTRAINT [CK_Usuarios_FechaNac] CHECK  (([fecha_nacimiento] IS NULL OR [fecha_nacimiento]<=CONVERT([date],getdate())))
ALTER TABLE [EDI].[Usuarios]  WITH CHECK ADD  CONSTRAINT [CK_Usuarios_Idents] CHECK  (([matricula] IS NOT NULL AND [num_empleado] IS NULL OR [matricula] IS NULL AND [num_empleado] IS NOT NULL OR [matricula] IS NULL AND [num_empleado] IS NULL))
ALTER TABLE [EDI].[Usuarios]  WITH CHECK ADD  CONSTRAINT [CK_Usuarios_Residencia_v2] CHECK  (([residencia] IS NULL OR ([residencia]='Externa' OR [residencia]='Interna')))
ALTER TABLE [EDI].[Usuarios]  WITH CHECK ADD  CONSTRAINT [CK_Usuarios_TelefonoLen] CHECK  (([telefono] IS NULL OR len([telefono])>=(7) AND len([telefono])<=(20)))
ALTER TABLE [EDI].[Usuarios]  WITH CHECK ADD  CONSTRAINT [CK_Usuarios_Tipo] CHECK  (([tipo_usuario]=N'EXTERNO' OR [tipo_usuario]=N'EMPLEADO' OR [tipo_usuario]=N'ALUMNO'))

-- 5. ÍNDICES
CREATE UNIQUE NONCLUSTERED INDEX [UX_Usuarios_Correo] ON [EDI].[Usuarios]([correo])
CREATE UNIQUE NONCLUSTERED INDEX [UX_Usuarios_Matricula] ON [EDI].[Usuarios]([matricula]) WHERE ([matricula] IS NOT NULL)
CREATE UNIQUE NONCLUSTERED INDEX [UX_Usuarios_NumEmpleado] ON [EDI].[Usuarios]([num_empleado]) WHERE ([num_empleado] IS NOT NULL)
CREATE UNIQUE NONCLUSTERED INDEX [UX_Miembros_FamiliaUsuario] ON [EDI].[Miembros_Familia]([id_familia] ASC, [id_usuario] ASC)
CREATE UNIQUE NONCLUSTERED INDEX [UX_Detalle_Provision_Uniq] ON [EDI].[Detalle_Provision]([id_provision] ASC, [id_usuario] ASC)
CREATE INDEX IX_Participantes_Usuario ON [EDI].[Chat_Participantes](id_usuario)
CREATE INDEX IX_Mensajes_Sala ON [EDI].[Chat_Mensajes](id_sala)


-- 6. CARGA DE DATOS 
SET IDENTITY_INSERT [EDI].[Roles] ON 
INSERT [EDI].[Roles] ([id_rol], [nombre_rol], [descripcion], [created_at], [updated_at], [activo]) VALUES (1, N'Admin', N'Administrador', CAST(N'2025-10-19T16:25:19.797' AS DateTime), NULL, 1)
INSERT [EDI].[Roles] ([id_rol], [nombre_rol], [descripcion], [created_at], [updated_at], [activo]) VALUES (2, N'PapaEDI', N'Tutor padre', CAST(N'2025-10-19T16:25:19.803' AS DateTime), NULL, 1)
INSERT [EDI].[Roles] ([id_rol], [nombre_rol], [descripcion], [created_at], [updated_at], [activo]) VALUES (3, N'MamaEDI', N'Tutor madre', CAST(N'2025-10-19T16:25:19.807' AS DateTime), NULL, 1)
INSERT [EDI].[Roles] ([id_rol], [nombre_rol], [descripcion], [created_at], [updated_at], [activo]) VALUES (4, N'HijoEDI', N'Alumno EDI', CAST(N'2025-10-19T16:25:19.810' AS DateTime), NULL, 1)
INSERT [EDI].[Roles] ([id_rol], [nombre_rol], [descripcion], [created_at], [updated_at], [activo]) VALUES (5, N'HijoSanguineo', N'Hijo sanguíneo', CAST(N'2025-10-19T16:25:19.817' AS DateTime), NULL, 1)
SET IDENTITY_INSERT [EDI].[Roles] OFF
GO

-- Insertar Cat_Estados
SET IDENTITY_INSERT [EDI].[Cat_Estados] ON 
INSERT [EDI].[Cat_Estados] ([id_cat_estado], [descripcion], [activo], [color]) VALUES (1, N'Activo', 1, N'#28a745')
INSERT [EDI].[Cat_Estados] ([id_cat_estado], [descripcion], [activo], [color]) VALUES (2, N'Prácticas en la Universidad', 1, N'#17a2b8')
INSERT [EDI].[Cat_Estados] ([id_cat_estado], [descripcion], [activo], [color]) VALUES (3, N'Prácticas fuera de la universidad', 1, N'#17a2b8')
INSERT [EDI].[Cat_Estados] ([id_cat_estado], [descripcion], [activo], [color]) VALUES (4, N'Salida a casa', 1, N'#ffc107')
INSERT [EDI].[Cat_Estados] ([id_cat_estado], [descripcion], [activo], [color]) VALUES (5, N'Enfermo', 1, N'#dc3545')
INSERT [EDI].[Cat_Estados] ([id_cat_estado], [descripcion], [activo], [color]) VALUES (6, N'Baja Temporal', 1, N'#6c757d')
SET IDENTITY_INSERT [EDI].[Cat_Estados] OFF
GO

-- Insertar Usuario 1
SET IDENTITY_INSERT [EDI].[Usuarios] ON 
INSERT [EDI].[Usuarios] ([id_usuario], [nombre], [apellido], [correo], [contrasena], [foto_perfil], [estado], [id_rol], [session_token], [created_at], [updated_at], [activo], [tipo_usuario], [matricula], [num_empleado], [carrera], [fecha_nacimiento], [telefono], [direccion], [residencia], [fcm_token]) 
VALUES (1, N'Aldahir Emmanuel', N'Ballina Nuñez', N'aldahir.ballina@ulv.edu.mx', N'$2b$10$mnejAF9sGeU.f2EYTELdiOmB5VF/cK2Dn1LiqoAlxqTRP4opqfB8O', NULL, N'Prácticas en la Universidad', 1, N'438d6b43-d512-4336-b334-052b8606cbd8', CAST(N'2025-10-19T16:46:04.207' AS DateTime), CAST(N'2026-01-06T10:50:27.787' AS DateTime), 1, N'ALUMNO', 221391, NULL, N'Ingeniería', CAST(N'2002-08-15' AS Date), N'5551234567', N'Nueva dirección 123', N'Externa', N'eH8m1FwUQB2qrn162omTcC:APA91bHzr82p-RipPu1dnST6gKpcS7qb_x7Yn-uIhsR-7gLK6P_J6I5TQiR9s79QgPcpg7Dbp_H5_YQ_DvtH0UaAxzOW29RlnnpJW_VzR8mNaxpXqIsmpms')
SET IDENTITY_INSERT [EDI].[Usuarios] OFF
GO

-- Inicialización de Salas de Chat (Comunidad de Padres)
IF NOT EXISTS (SELECT * FROM [EDI].[Chat_Salas] WHERE nombre = 'Comunidad de Padres')
BEGIN
    INSERT INTO [EDI].[Chat_Salas] (nombre, tipo, activo) 
    VALUES ('Comunidad de Padres', 'GRUPAL', 1);
END
GO

PRINT 'Base de datos EDI migrada correctamente. Usuario 1 cargado.'
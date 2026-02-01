exports.Q = {
  // Crea una sala nueva
  createSala: `
    INSERT INTO EDI.Chat_Salas (nombre, tipo) VALUES (@nombre, @tipo);
    SELECT SCOPE_IDENTITY() as id_sala;
  `,

  // Agrega un usuario a una sala
  addParticipante: `
    INSERT INTO EDI.Chat_Participantes (id_sala, id_usuario, es_admin)
    VALUES (@id_sala, @id_usuario, @es_admin);
  `,

  // Guardar mensaje
  sendMessage: `
    INSERT INTO EDI.Chat_Mensajes (id_sala, id_usuario, mensaje, tipo_mensaje)
    VALUES (@id_sala, @id_usuario, @mensaje, @tipo_mensaje);
  `,

  // Listar mis chats 
  getMyChats: `
    SELECT 
        s.id_sala,
        s.tipo,
        CASE 
            WHEN s.tipo = 'GRUPAL' THEN s.nombre
            ELSE (
                SELECT TOP 1 u.nombre 
                FROM EDI.Chat_Participantes cp2 
                JOIN EDI.Usuarios u ON u.id_usuario = cp2.id_usuario
                WHERE cp2.id_sala = s.id_sala AND cp2.id_usuario != @id_usuario
            )
        END as titulo_chat,
        (SELECT TOP 1 m.mensaje FROM EDI.Chat_Mensajes m WHERE m.id_sala = s.id_sala ORDER BY m.created_at DESC) as ultimo_mensaje,
        (SELECT TOP 1 m.created_at FROM EDI.Chat_Mensajes m WHERE m.id_sala = s.id_sala ORDER BY m.created_at DESC) as fecha_ultimo
    FROM EDI.Chat_Salas s
    JOIN EDI.Chat_Participantes cp ON cp.id_sala = s.id_sala
    WHERE cp.id_usuario = @id_usuario AND s.activo = 1
    ORDER BY fecha_ultimo DESC
  `,

  // Obtener mensajes de una sala específica
  getMensajes: `
    SELECT 
        m.id_mensaje,
        m.id_sala,
        m.id_usuario,
        u.nombre as nombre_remitente,
        m.mensaje,
        m.created_at,
        CASE WHEN m.id_usuario = @id_usuario THEN 1 ELSE 0 END as es_mio
    FROM EDI.Chat_Mensajes m
    JOIN EDI.Usuarios u ON u.id_usuario = m.id_usuario
    WHERE m.id_sala = @id_sala
    ORDER BY m.created_at ASC
  `,

  // Buscar si ya existe chat privado entre dos personas
  findPrivateChat: `
    SELECT p1.id_sala
    FROM EDI.Chat_Participantes p1
    JOIN EDI.Chat_Participantes p2 ON p1.id_sala = p2.id_sala
    JOIN EDI.Chat_Salas s ON s.id_sala = p1.id_sala
    WHERE s.tipo = 'PRIVADO'
      AND p1.id_usuario = @my_id
      AND p2.id_usuario = @other_id
  `
};
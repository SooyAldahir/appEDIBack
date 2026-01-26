exports.Q = {
  // Crea una sala nueva
  createSala: `
    INSERT INTO Chat_Salas (nombre, tipo) VALUES (@nombre, @tipo);
    SELECT SCOPE_IDENTITY() as id_sala;
  `,

  // Agrega un usuario a una sala
  addParticipante: `
    INSERT INTO Chat_Participantes (id_sala, id_usuario, es_admin)
    VALUES (@id_sala, @id_usuario, @es_admin);
  `,

  // Guardar mensaje
  sendMessage: `
    INSERT INTO Chat_Mensajes (id_sala, id_usuario, mensaje, tipo_mensaje)
    VALUES (@id_sala, @id_usuario, @mensaje, @tipo_mensaje);
  `,

  // Listar mis chats 
  getMyChats: `
    SELECT 
        s.id_sala,
        s.tipo,
        -- Si es GRUPAL, usa el nombre de la sala. 
        -- Si es PRIVADO, busca el nombre del OTRO participante.
        CASE 
            WHEN s.tipo = 'GRUPAL' THEN s.nombre
            ELSE (
                SELECT TOP 1 u.nombre 
                FROM Chat_Participantes cp2 
                JOIN Usuarios u ON u.id_usuario = cp2.id_usuario
                WHERE cp2.id_sala = s.id_sala AND cp2.id_usuario != @id_usuario
            )
        END as titulo_chat,
        -- Último mensaje para mostrar en la lista
        (SELECT TOP 1 m.mensaje FROM Chat_Mensajes m WHERE m.id_sala = s.id_sala ORDER BY m.created_at DESC) as ultimo_mensaje,
        (SELECT TOP 1 m.created_at FROM Chat_Mensajes m WHERE m.id_sala = s.id_sala ORDER BY m.created_at DESC) as fecha_ultimo
    FROM Chat_Salas s
    JOIN Chat_Participantes cp ON cp.id_sala = s.id_sala
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
    FROM Chat_Mensajes m
    JOIN Usuarios u ON u.id_usuario = m.id_usuario
    WHERE m.id_sala = @id_sala
    ORDER BY m.created_at ASC
  `,

  // Buscar si ya existe chat privado entre dos personas
  findPrivateChat: `
    SELECT p1.id_sala
    FROM Chat_Participantes p1
    JOIN Chat_Participantes p2 ON p1.id_sala = p2.id_sala
    JOIN Chat_Salas s ON s.id_sala = p1.id_sala
    WHERE s.tipo = 'PRIVADO'
      AND p1.id_usuario = @my_id
      AND p2.id_usuario = @other_id
  `
};
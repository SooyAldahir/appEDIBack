const cron = require('node-cron');
const { sql, queryP } = require('../dataBase/dbConnection');
const { enviarNotificacionMulticast } = require('../utils/firebase');
const ID_AUTOR_SISTEMA = 1; 
const IMAGEN_CUMPLEANOS = '/uploads/feliz_cumpleanos_generico.jpg'; 
const verificarCumpleanos = async () => {
  console.log('🎂 Iniciando verificación diaria de cumpleaños...');
  
  try {
    const cumpleaneros = await queryP(`
      SELECT id_usuario, nombre, apellido, id_familia 
      FROM dbo.Usuarios 
      WHERE DAY(fecha_nacimiento) = DAY(GETDATE()) 
      AND MONTH(fecha_nacimiento) = MONTH(GETDATE())
      AND activo = 1
    `);

    if (cumpleaneros.length === 0) {
      console.log('🎂 Hoy no hay cumpleaños.');
      return;
    }

    for (const user of cumpleaneros) {
      const nombreCompleto = `${user.nombre} ${user.apellido || ''}`.trim();
      const yaPublicado = await queryP(`
        SELECT id_post FROM dbo.Publicaciones 
        WHERE CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)
        AND tipo = 'CUMPLEAÑOS' 
        AND mensaje LIKE @patronNombre
      `, {
        patronNombre: { type: sql.NVarChar, value: `%${nombreCompleto}%` }
      });

      if (yaPublicado.length > 0) continue; 
      const titulo = `¡Feliz cumpleaños ${nombreCompleto}! 🎂🎉🎊`;
      const mensaje = "El departamento de capellanía te desea lo mejor hoy en este día tan especial. ¡Que Dios te bendiga grandemente!";
      const postResult = await queryP(`
        INSERT INTO dbo.Publicaciones 
          (id_usuario, categoria_post, mensaje, url_imagen, tipo, estado, created_at, activo)
        OUTPUT INSERTED.id_post
        VALUES 
          (@idUser, 'Institucional', @msg, @img, 'CUMPLEAÑOS', 'Aprobada', SYSDATETIME(), 1)
      `, {
        idUser: { type: sql.Int, value: ID_AUTOR_SISTEMA }, 
        msg:    { type: sql.NVarChar, value: `${titulo}\n\n${mensaje}` },
        img:    { type: sql.NVarChar, value: IMAGEN_CUMPLEANOS }
      });

      const idPost = postResult[0].id_post;
      console.log(`✅ Publicación creada para ${nombreCompleto} (ID: ${idPost})`);

      if (user.id_familia) {
        const familiares = await queryP(`
          SELECT fcm_token FROM dbo.Usuarios 
          WHERE id_familia = @idFam AND activo = 1 
          AND fcm_token IS NOT NULL AND LEN(fcm_token) > 10
        `, { idFam: { type: sql.Int, value: user.id_familia } });

        const tokens = familiares.map(f => f.fcm_token);
        
        if (tokens.length > 0) {
          await enviarNotificacionMulticast(
            tokens,
            '🎉 ¡Cumpleaños en la familia!',
            `Hoy es el cumpleaños de ${user.nombre}. ¡Entra a felicitarlo!`,
            { tipo: 'POST_DETALLE', id_referencia: idPost.toString() }
          );
        }
      }
    }

  } catch (error) {
    console.error('Error en servicio cumpleaños:', error);
  }
};

const initCronJobs = () => {
  cron.schedule('0 8 * * *', () => {
    verificarCumpleanos();
  }, { timezone: "America/Mexico_City" });
  console.log('Cron Jobs iniciados.');
};

module.exports = { initCronJobs };
const admin = require("firebase-admin");
const serviceAccount = require("../../../serviceAccountKey.json"); 

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log("Firebase Admin inicializado correctamente.");
} catch (error) {
  console.error("Error inicializando Firebase:", error);
}

const enviarNotificacionPush = async (tokenDispositivo, titulo, cuerpo, data) => {
  if (!tokenDispositivo) return;
  
  try {
    await admin.messaging().send({
      token: tokenDispositivo,
      notification: {
        title: titulo,
        body: cuerpo,
      },
      // Data debe ser siempre Strings. Convertimos lo que llegue.
      data: {
        tipo: data.tipo || 'GENERAL',
        id_referencia: data.id ? data.id.toString() : '0',
        click_action: 'FLUTTER_NOTIFICATION_CLICK' 
      }, 
    });
    console.log(`Notificación enviada a ${tokenDispositivo.substring(0, 10)}...`);
  } catch (error) {
    console.error("Error enviando notificación Push:", error);
  }
};

module.exports = { enviarNotificacionPush };
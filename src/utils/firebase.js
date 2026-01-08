const admin = require("firebase-admin");
const serviceAccount = require("../../../serviceAccountKey.json"); // Ajusta la ruta si es necesario

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("🔥 Firebase Admin inicializado correctamente.");
  }
} catch (error) {
  console.error("❌ Error inicializando Firebase:", error);
}

// 1. Enviar a UN dispositivo (Funciona con la API HTTP v1 actual)
const enviarNotificacionPush = async (tokenDispositivo, titulo, cuerpo, data) => {
  if (!tokenDispositivo) return;
  
  try {
    await admin.messaging().send({
      token: tokenDispositivo,
      notification: {
        title: titulo,
        body: cuerpo,
      },
      data: {
        tipo: data.tipo || 'GENERAL',
        id_referencia: data.id ? data.id.toString() : '0',
        click_action: 'FLUTTER_NOTIFICATION_CLICK' 
      }, 
    });
    // console.log(`Push enviado a ${tokenDispositivo.substring(0, 10)}...`);
  } catch (error) {
    console.error("❌ Error Push Individual:", error);
  }
};

// 2. Enviar a VARIOS dispositivos (Chat grupal)
// CORRECCIÓN: Usamos sendEachForMulticast en lugar de sendMulticast
const enviarNotificacionMulticast = async (tokens, titulo, cuerpo, data) => {
  if (!tokens || tokens.length === 0) return;
  
  try {
    const message = {
      notification: { title: titulo, body: cuerpo },
      data: {
        tipo: data.tipo || 'GENERAL',
        id_sala: data.id_sala ? data.id_sala.toString() : '0',
        click_action: 'FLUTTER_NOTIFICATION_CLICK' 
      },
      tokens: tokens, // Array de tokens
    };

    // 👇👇 AQUÍ ESTÁ EL CAMBIO IMPORTANTE 👇👇
    const response = await admin.messaging().sendEachForMulticast(message);
    
    console.log(`📡 Push Grupal enviado: ${response.successCount} éxitos, ${response.failureCount} fallos.`);
    
    // (Opcional) Aquí podrías limpiar tokens que dieron error si quisieras
  } catch (error) {
    console.error("❌ Error Push Multicast:", error);
  }
};

module.exports = { enviarNotificacionPush, enviarNotificacionMulticast };
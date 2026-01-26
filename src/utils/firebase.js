const admin = require("firebase-admin");
const serviceAccount = require("../../../serviceAccountKey.json");

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("🔥 Firebase Admin inicializado correctamente.");
  }
} catch (error) {
  console.error("❌ Error inicializando Firebase:", error.message);
}

const formatData = (data) => {
  const formatted = {};
  if (data) {
    Object.keys(data).forEach(key => {
      formatted[key] = data[key] != null ? data[key].toString() : '';
    });
  }
  if (!formatted.click_action) formatted.click_action = 'FLUTTER_NOTIFICATION_CLICK';
  if (!formatted.tipo) formatted.tipo = 'GENERAL';
  return formatted;
};

const enviarNotificacionPush = async (tokenDispositivo, titulo, cuerpo, data = {}) => {
  if (!tokenDispositivo) return;
  
  try {
    await admin.messaging().send({
      token: tokenDispositivo,
      notification: {
        title: titulo,
        body: cuerpo,
      },
      data: formatData(data), 
    });
  } catch (error) {
    console.error("❌ Error Push Individual:", error.message);
  }
};

const enviarNotificacionMulticast = async (tokens, titulo, cuerpo, data = {}) => {
  if (!tokens || tokens.length === 0) return;
  
  const uniqueTokens = [...new Set(tokens)].filter(t => t && t.length > 10);
  if (uniqueTokens.length === 0) return;

  try {
    const message = {
      notification: { title: titulo, body: cuerpo },
      data: formatData(data), 
      tokens: uniqueTokens,
    };
    const response = await admin.messaging().sendEachForMulticast(message);
    
    console.log(`Push Grupal: ${response.successCount} enviados, ${response.failureCount} fallos.`);
    
    if (response.failureCount > 0) {
       const firstError = response.responses.find(r => !r.success);
       console.log("Ejemplo de error:", firstError?.error?.message);
    }
  } catch (error) {
    console.error("Error Push Multicast:", error.message);
  }
};

module.exports = { enviarNotificacionPush, enviarNotificacionMulticast };
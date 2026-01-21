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

// --- HELPER IMPORTANTE ---
// Convierte cualquier dato que envíes a String (Firebase falla si envías números directos en 'data')
const formatData = (data) => {
  const formatted = {};
  if (data) {
    Object.keys(data).forEach(key => {
      // Si el valor existe, lo convertimos a texto. Si es null, enviamos cadena vacía.
      formatted[key] = data[key] != null ? data[key].toString() : '';
    });
  }
  // Valores por defecto para que Flutter siempre sepa qué hacer
  if (!formatted.click_action) formatted.click_action = 'FLUTTER_NOTIFICATION_CLICK';
  if (!formatted.tipo) formatted.tipo = 'GENERAL';
  return formatted;
};

// 1. Enviar a UN dispositivo (Ej: Chat privado, Asignación de alumno)
const enviarNotificacionPush = async (tokenDispositivo, titulo, cuerpo, data = {}) => {
  if (!tokenDispositivo) return;
  
  try {
    await admin.messaging().send({
      token: tokenDispositivo,
      notification: {
        title: titulo,
        body: cuerpo,
      },
      // 👇 Aquí está la magia: pasamos tus datos (id_familia, etc) formateados
      data: formatData(data), 
    });
    // console.log(`Push enviado a ${tokenDispositivo.substring(0, 10)}...`);
  } catch (error) {
    console.error("❌ Error Push Individual:", error.message);
  }
};

// 2. Enviar a VARIOS dispositivos (Ej: Chat grupal, Nueva Familia creada)
const enviarNotificacionMulticast = async (tokens, titulo, cuerpo, data = {}) => {
  if (!tokens || tokens.length === 0) return;
  
  // Limpieza de tokens duplicados o vacíos
  const uniqueTokens = [...new Set(tokens)].filter(t => t && t.length > 10);
  if (uniqueTokens.length === 0) return;

  try {
    const message = {
      notification: { title: titulo, body: cuerpo },
      data: formatData(data), // 👇 Usamos el mismo formateador universal
      tokens: uniqueTokens,
    };

    // Usamos sendEachForMulticast que es la versión moderna y estable
    const response = await admin.messaging().sendEachForMulticast(message);
    
    console.log(`📡 Push Grupal: ${response.successCount} enviados, ${response.failureCount} fallos.`);
    
    if (response.failureCount > 0) {
       // Opcional: ver por qué fallaron algunos
       const firstError = response.responses.find(r => !r.success);
       console.log("   Ejemplo de error:", firstError?.error?.message);
    }
  } catch (error) {
    console.error("❌ Error Push Multicast:", error.message);
  }
};

module.exports = { enviarNotificacionPush, enviarNotificacionMulticast };
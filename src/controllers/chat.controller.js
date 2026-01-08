const { sql, queryP } = require('../dataBase/dbConnection');
const { ok, created, bad, fail } = require('../utils/http');
const { Q } = require('../queries/chat.queries');

// 1. INICIAR CHAT PRIVADO (Sirve para Admin-Padre, Padre-Hijo, Admin-Alumno)
exports.initPrivateChat = async (req, res) => {
    try {
        const myId = req.user.id_usuario ?? req.user.id;
        const { targetUserId } = req.body; // El ID de con quién quiero hablar

        if (!targetUserId) return bad(res, 'Falta el ID del usuario destino');

        // A. ¿Ya existe sala?
        const existing = await queryP(Q.findPrivateChat, {
            my_id: { type: sql.Int, value: myId },
            other_id: { type: sql.Int, value: targetUserId }
        });

        if (existing.length > 0) {
            // Ya existe, devolvemos el ID de la sala
            return ok(res, { id_sala: existing[0].id_sala, created: false });
        }

        // B. No existe, creamos sala nueva
        const salaResult = await queryP(Q.createSala, {
            nombre: { type: sql.NVarChar, value: null }, // Privado no lleva nombre
            tipo: { type: sql.NVarChar, value: 'PRIVADO' }
        });
        const idSala = salaResult[0].id_sala;

        // C. Agregamos a los dos participantes
        // Yo
        await queryP(Q.addParticipante, { id_sala: {type: sql.Int, value: idSala}, id_usuario: {type: sql.Int, value: myId}, es_admin: {type: sql.Bit, value: 1} });
        // El otro
        await queryP(Q.addParticipante, { id_sala: {type: sql.Int, value: idSala}, id_usuario: {type: sql.Int, value: targetUserId}, es_admin: {type: sql.Bit, value: 0} });

        created(res, { id_sala: idSala, created: true });

    } catch (e) { fail(res, e); }
};

// 2. CREAR GRUPO (Para Admin-Padres)
exports.createGroup = async (req, res) => {
    try {
        const myId = req.user.id_usuario ?? req.user.id;
        const { nombre_grupo, ids_usuarios } = req.body; // Array de IDs de padres

        if (!nombre_grupo || !ids_usuarios) return bad(res, 'Datos incompletos');

        // Crear Sala
        const salaResult = await queryP(Q.createSala, {
            nombre: { type: sql.NVarChar, value: nombre_grupo },
            tipo: { type: sql.NVarChar, value: 'GRUPAL' }
        });
        const idSala = salaResult[0].id_sala;

        // Agregarme a mí (Admin)
        await queryP(Q.addParticipante, { id_sala: {type: sql.Int, value: idSala}, id_usuario: {type: sql.Int, value: myId}, es_admin: {type: sql.Bit, value: 1} });

        // Agregar a todos los demás
        // Nota: Esto se podría optimizar con un bucle o TVP en SQL, pero por ahora un for funciona
        for (const userId of ids_usuarios) {
             await queryP(Q.addParticipante, { id_sala: {type: sql.Int, value: idSala}, id_usuario: {type: sql.Int, value: userId}, es_admin: {type: sql.Bit, value: 0} });
        }

        created(res, { id_sala: idSala, message: 'Grupo creado' });
    } catch (e) { fail(res, e); }
};

// 3. ENVIAR MENSAJE
exports.sendMessage = async (req, res) => {
    try {
        const myId = req.user.id_usuario ?? req.user.id;
        const { id_sala, mensaje } = req.body;

        await queryP(Q.sendMessage, {
            id_sala: { type: sql.Int, value: id_sala },
            id_usuario: { type: sql.Int, value: myId },
            mensaje: { type: sql.NVarChar, value: mensaje },
            tipo_mensaje: { type: sql.NVarChar, value: 'TEXTO' }
        });
        
        // AQUÍ DEBERÍAS PONER LA NOTIFICACIÓN PUSH A LOS MIEMBROS DE LA SALA
        
        ok(res, { message: 'Enviado' });
    } catch (e) { fail(res, e); }
};

// 4. LISTAR MIS CHATS
exports.getMyChats = async (req, res) => {
    try {
        const myId = req.user.id_usuario ?? req.user.id;
        const rows = await queryP(Q.getMyChats, { id_usuario: { type: sql.Int, value: myId } });
        ok(res, rows);
    } catch (e) { fail(res, e); }
};

// 5. VER MENSAJES DE UNA SALA
exports.getMessages = async (req, res) => {
    try {
        const myId = req.user.id_usuario ?? req.user.id;
        const idSala = req.params.id_sala;
        
        const rows = await queryP(Q.getMensajes, { 
            id_sala: { type: sql.Int, value: idSala },
            id_usuario: { type: sql.Int, value: myId } // Para saber cuál es mío
        });
        ok(res, rows);
    } catch (e) { fail(res, e); }
};
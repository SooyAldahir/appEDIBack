const { sql, queryP } = require('../dataBase/dbConnection');
const { comparePassword } = require('../utils/hash');
const { newSessionToken } = require('../utils/token');
const { ok, bad, fail } = require('../utils/http');
const UQ = require('../queries/usuarios.queries').Q;

exports.login = async (req, res) => {
  try {
    // 🔍 DEBUG EXTREMO
    console.log("Headers recibidos:", req.headers['content-type']);
    console.log("Body CRUDO recibido:", req.body); 
    // ^ Si esto sale {} o undefined, el problema es express.json() o el cliente Flutter

    const { login, password } = req.body || {};

    if (!login || !password) {
        return bad(res, 'Faltan datos: login o password');
    }

    const rows = await queryP(UQ.byLogin, { Login: { type: sql.NVarChar, value: login } });
    if (!rows.length) return bad(res, 'Usuario no encontrado');

    const user = rows[0];
    const okPass = await comparePassword(password, user.contrasena);
    if (!okPass) return bad(res, 'Contraseña incorrecta');

    const token = newSessionToken();
    await queryP(UQ.updateSession, {
      token: { type: sql.NVarChar, value: token },
      id_usuario: { type: sql.Int, value: user.id_usuario }
    });

    delete user.contrasena;
    user.session_token = token;
    ok(res, user);

  } catch (e) { 
    console.error("Login Error:", e);
    fail(res, e); 
  }
};

// ... logout igual ...
exports.logout = async (req, res) => {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ','').trim();
    if (!token) return bad(res, 'Token requerido');
    await queryP(UQ.clearToken, { token: { type: sql.NVarChar, value: token } });
    ok(res, { message: 'Sesión cerrada' });
  } catch (e) { fail(res, e); }
};
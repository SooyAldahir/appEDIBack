const { v4: uuid } = require('uuid');
// Token opaco (no JWT). Puedes hashearlo antes de guardar si gustas.
exports.newSessionToken = () => uuid();

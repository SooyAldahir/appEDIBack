const { v4: uuid } = require('uuid');

exports.newSessionToken = () => uuid();

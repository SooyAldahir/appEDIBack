const bcrypt = require('bcryptjs');
const SALT = 10;
exports.hashPassword = async (plain) => bcrypt.hash(plain, SALT);
exports.comparePassword = async (plain, hashed) => bcrypt.compare(plain, hashed);

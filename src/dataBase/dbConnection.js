const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const sql = require('mssql');



const dbConfig = {
  user: process.env.DBUSER,                
  password: process.env.DBPASSWORD,        
  server: process.env.DBSERVER || '127.0.0.1', 
  database: process.env.DATABASE,          
  port: Number(process.env.DBPORT || 1433),
  pool: { max: 10, min: 0, idleTimeoutMillis: 60000 },
  options: {
    encrypt: false,                        
    trustServerCertificate: true,
    enableArithAbort: true               
  }
};

const pool = new sql.ConnectionPool(dbConfig);
const poolConnect = pool.connect(); // inicia la conexión

async function getConnection() {
  await poolConnect; // Espera a que la conexión esté lista
  return pool;
}

async function queryP(query, params = {}) {
  await poolConnect;
  const request = pool.request();
  for (const [k, v] of Object.entries(params)) {
    request.input(k, v.type || sql.NVarChar, v.value);
  }
  const result = await request.query(query);
  return result.recordset;
}

module.exports = { sql, queryP, pool, getConnection };

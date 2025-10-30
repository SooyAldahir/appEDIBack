require('dotenv').config();
const app = require('./app');
const { queryP } = require('./dataBase/dbConnection');

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  try {
    await queryP('SELECT 1 AS up');
    console.log(`✅ API EDI-301 lista en http://localhost:${PORT}`);
    if (process.env.BYPASS_AUTH === '1') {
  console.warn('⚠️  AUTH DESACTIVADA TEMPORALMENTE (BYPASS_AUTH=1)');
}

  } catch (e) {
    console.error('❌ Error al conectar a SQL Server:', e.message);
  }
});

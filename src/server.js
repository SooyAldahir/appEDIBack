require('dotenv').config();
const app = require('./app');
const { queryP } = require('./dataBase/dbConnection');
const { initCronJobs } = require('./services/birthday.service');

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', async () => {
  initCronJobs();
  try {
    await queryP('SELECT 1 AS up');
    
    console.log(`API EDI-301 lista en puerto ${PORT} (Accesible desde red)`);

    if (process.env.BYPASS_AUTH === '1') {
      console.warn('AUTH DESACTIVADA TEMPORALMENTE (BYPASS_AUTH=1)');
    }

  } catch (e) {
    console.error('Error al conectar a SQL Server:', e.message);
  }
});
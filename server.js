const dotenv = require('dotenv');
dotenv.config();

const db = require('./data/db');
const { createApp } = require('./app');

const PORT = process.env.PORT || 3000;
const app = createApp();

// === Start ===
(async () => {
  await db.init();
  app.listen(PORT, () => {
    console.log('========================================');
    console.log('  Sri Sai Realty Server Running');
    console.log('  Site:      http://localhost:' + PORT);
    console.log('  Admin:     http://localhost:' + PORT + '/admin/');
    console.log('========================================');
  });
})();

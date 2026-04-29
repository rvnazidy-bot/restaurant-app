import dotenv from 'dotenv';

dotenv.config();

process.on('unhandledRejection', (reason) => {
  console.error('UnhandledRejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('UncaughtException:', err);
});

const { default: app } = await import('./app.js');

const PORT = process.env.PORT || 5000;

console.log('Starting TSARALAZA backend with config:', {
  nodeEnv: process.env.NODE_ENV,
  port: PORT,
  frontendUrl: process.env.FRONTEND_URL,
  dbHost: process.env.DB_HOST,
  dbPort: process.env.DB_PORT,
  dbName: process.env.DB_NAME
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`TSARALAZA backend running on 0.0.0.0:${PORT}`);
});

import './config/loadEnv.js';
import http from 'http';
import app from './app.js';
import connectDb from './config/db.js';

const PORT = Number(process.env.PORT) || 8080;
const HOST = '0.0.0.0';

// Health endpoint for DigitalOcean readiness probe
app.get('/health', (_req, res) => res.status(200).send('OK'));

async function startServer() {
  try {
    await connectDb();

    const server = http.createServer(app);
    server.listen(PORT, HOST, () => {
      console.log(`✅ API listening on http://${HOST}:${PORT}`);
    });

    // Graceful shutdown
    const shutdown = () => {
      console.log('🛑 Shutting down...');
      server.close(() => process.exit(0));
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    console.error('❌ Failed to start server', error);
    process.exit(1);
  }
}

startServer();

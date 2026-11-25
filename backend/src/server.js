const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { connectDB } = require('./config/db');
const { initCronJobs, stopCronJobs } = require('./services/cronService');
const { initSocket } = require('./services/socketService');
const User = require('./models/User');
const { seedDemoData } = require('./seed/demo');

let server;

const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed demo data if database is empty (e.g. in development fallback)
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[Server] Empty database detected. Auto-seeding catalog and demo users...');
      await seedDemoData();
    }

    const httpServer = http.createServer(app);

    // Initialize Socket.io with HTTP server
    initSocket(httpServer);

    server = httpServer.listen(env.PORT, () => {
      console.log(`[Server] Skill-Swap Backend + Socket.io running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      console.log(`[Server] Health check: http://localhost:${env.PORT}/api/health`);
    });

    // Start background schedulers
    initCronJobs();

    return server;
  } catch (err) {
    console.error('[Server] Failed to start server:', err.message);
    process.exit(1);
  }
};

const handleShutdown = () => {
  console.log('[Process] Shutting down gracefully...');
  stopCronJobs();
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);

process.on('unhandledRejection', (err) => {
  console.error('[Process] Unhandled Rejection:', err.message);
  handleShutdown();
});

process.on('uncaughtException', (err) => {
  console.error('[Process] Uncaught Exception:', err.message);
  process.exit(1);
});

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };

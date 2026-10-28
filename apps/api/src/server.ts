import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { initFirebase } from './config/firebase';
import { setupSockets } from './sockets';
import prisma from './config/prisma';

async function bootstrap() {
  // Initialize Firebase
  initFirebase();

  const app = createApp();
  const server = http.createServer(app);

  // Setup Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: [config.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  setupSockets(io);

  // Test DB connection
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');
  } catch (err) {
    logger.error('❌ Database connection failed:', err);
    if (config.NODE_ENV === 'production') process.exit(1);
  }

  server.listen(config.PORT, () => {
    logger.info(`
╔══════════════════════════════════════════╗
║   🚗 DriveSafe India API Server          ║
║   Environment: ${config.NODE_ENV.padEnd(26)}║
║   Port: ${String(config.PORT).padEnd(33)}║
║   Health: http://localhost:${config.PORT}/health ║
╚══════════════════════════════════════════╝
    `);
    
    if (config.DEV_BYPASS_AUTH) {
      logger.warn('⚠️  DEV_BYPASS_AUTH=true — Firebase auth bypassed');
      logger.info('  Dev OTP:', config.DEV_OTP);
      logger.info('  Customer: +919999999901');
      logger.info('  Driver:   +919999999902');
      logger.info('  Admin:    +919999999900');
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received. Shutting down...');
    await prisma.$disconnect();
    server.close(() => process.exit(0));
  });

  process.on('SIGINT', async () => {
    logger.info('SIGINT received. Shutting down...');
    await prisma.$disconnect();
    server.close(() => process.exit(0));
  });
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

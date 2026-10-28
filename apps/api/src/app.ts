import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './modules/auth/auth.routes';
import bookingRoutes from './modules/booking/booking.routes';
import driverRoutes from './modules/driver/driver.routes';
import adminRoutes from './modules/admin/admin.routes';
import userRoutes from './modules/user/user.routes';
import paymentRoutes from './modules/payment/payment.routes';
import { logger } from './utils/logger';
import { v4 as uuidv4 } from 'uuid';

export function createApp() {
  const app = express();

  // Security
  app.use(helmet({
    crossOriginEmbedderPolicy: false,
  }));

  app.use(cors({
    origin: [config.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
  }));

  // Request parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Correlation ID
  app.use((req, _res, next) => {
    req.headers['x-correlation-id'] = req.headers['x-correlation-id'] || uuidv4();
    next();
  });

  // Request logging
  app.use((req, _res, next) => {
    logger.debug(`${req.method} ${req.path}`, {
      correlationId: req.headers['x-correlation-id'],
      ip: req.ip,
    });
    next();
  });

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    message: { success: false, error: 'Too many requests' },
  });
  app.use('/api', limiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, error: 'Too many authentication attempts' },
  });
  app.use('/api/auth', authLimiter);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'DriveSafe India API',
      timestamp: new Date().toISOString(),
      env: config.NODE_ENV,
    });
  });

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/driver', driverRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/payments', paymentRoutes);

  // 404
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route not found' });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}

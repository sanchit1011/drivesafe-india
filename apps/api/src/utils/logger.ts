import winston from 'winston';
import { config } from '../config';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  config.NODE_ENV === 'development'
    ? winston.format.colorize()
    : winston.format.json(),
  config.NODE_ENV === 'development'
    ? winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
        return `${timestamp} [${level}] ${message} ${metaStr}`;
      })
    : winston.format.json()
);

export const logger = winston.createLogger({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [new winston.transports.Console()],
});

export default logger;

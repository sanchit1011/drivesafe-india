import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 chars'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 chars'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  DEV_BYPASS_AUTH: z.coerce.boolean().default(false),
  DEV_OTP: z.string().default('123456'),
});

function loadConfig() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    result.error.errors.forEach(e => {
      console.error(`  ${e.path.join('.')}: ${e.message}`);
    });
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
  return result.success ? result.data : envSchema.parse({ ...process.env, DATABASE_URL: process.env.DATABASE_URL || 'postgresql://localhost:5432/drivesafe_dev', JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-minimum-32-characters-long!', JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-minimum-32-chars!' });
}

export const config = loadConfig();
export const isDev = config.NODE_ENV === 'development';
export const isTest = config.NODE_ENV === 'test';
export const isProd = config.NODE_ENV === 'production';

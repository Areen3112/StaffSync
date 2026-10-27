import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  FRONTEND_URL: z.string().url(),
  FRONTEND_URLS: z.string().optional(),
  BUSINESS_TIMEZONE: z.string().default('Asia/Kolkata'),
});

export const env = schema.parse(process.env);

const configuredFrontendOrigins = (env.FRONTEND_URLS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const localDevelopmentOrigins = env.NODE_ENV === 'development'
  ? ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003']
  : [];

export const allowedFrontendOrigins = new Set([
  env.FRONTEND_URL,
  ...configuredFrontendOrigins,
  ...localDevelopmentOrigins,
]);

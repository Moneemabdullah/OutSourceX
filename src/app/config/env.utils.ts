import dotenv from 'dotenv';
import status from 'http-status';
import { z } from 'zod';
import AppError from '../errorHelpers/AppError';

dotenv.config();

/**
 * ✅ Zod Schema
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number(),

  DATABASE_URL: z.string().min(1),

  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().url(),

  ACCESS_TOKEN_SECRET: z.string().min(1),
  REFRESH_TOKEN_SECRET: z.string().min(1),

  ACCESS_TOKEN_EXPIRES_IN: z.string().min(1),
  REFRESH_TOKEN_EXPIRES_IN: z.string().min(1),

  BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN: z.string().min(1),
  BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE: z.string().min(1),

  EMAIL_SENDER_SMTP_HOST: z.string().min(1),
  EMAIL_SENDER_SMTP_PORT: z.coerce.number(),
  EMAIL_SENDER_SMTP_USER: z.string().min(1),
  EMAIL_SENDER_SMTP_PASS: z.string().min(1),
  EMAIL_SENDER_FROM: z.string().email(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().url().optional(),

  FRONTEND_URL: z.string().url().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),

  SUPER_ADMIN_EMAIL: z.string().email(),
  SUPER_ADMIN_PASSWORD: z.string().min(8),
});

/**
 * ✅ Load & Validate
 */
const loadEnvVariable = () => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join('\n');

    throw new AppError(
      status.INTERNAL_SERVER_ERROR,
      `❌ Invalid Environment Variables:\n${errors}`
    );
  }

  const env = parsed.data;

  /**
   * ✅ Return structured config (same shape you like)
   */
  return {
    NODE_ENV: env.NODE_ENV,
    PORT: env.PORT,
    DATABASE_URL: env.DATABASE_URL,

    BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: env.BETTER_AUTH_URL,

    ACCESS_TOKEN_SECRET: env.ACCESS_TOKEN_SECRET,
    REFRESH_TOKEN_SECRET: env.REFRESH_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRES_IN: env.ACCESS_TOKEN_EXPIRES_IN,
    REFRESH_TOKEN_EXPIRES_IN: env.REFRESH_TOKEN_EXPIRES_IN,

    BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN: env.BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN,
    BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE: env.BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE,

    EMAIL_SENDER_: {
      SMTP_HOST: env.EMAIL_SENDER_SMTP_HOST,
      SMTP_PORT: env.EMAIL_SENDER_SMTP_PORT,
      SMTP_USER: env.EMAIL_SENDER_SMTP_USER,
      SMTP_PASS: env.EMAIL_SENDER_SMTP_PASS,
      FROM: env.EMAIL_SENDER_FROM,
    },

    GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: env.GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL: env.GOOGLE_CALLBACK_URL,

    FRONTEND_URL: env.FRONTEND_URL,

    CLOUDINARY_CLOUD_NAME: env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: env.CLOUDINARY_API_SECRET,

    STRIPE_: {
      SECRET_KEY: env.STRIPE_SECRET_KEY,
      WEBHOOK_SECRET: env.STRIPE_WEBHOOK_SECRET,
    },

    SUPER_ADMIN_: {
      EMAIL: env.SUPER_ADMIN_EMAIL,
      PASSWORD: env.SUPER_ADMIN_PASSWORD,
    },
  };
};

export const envVars = loadEnvVariable();

import { UserRole } from '@prisma/client';
import { envVars } from '../config/env.utils.js';
import AppError from '../errorHelpers/AppError.js';
import { createLogger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';

const seedLogger = createLogger('seedSuperAdmin');

async function seedSuperUser() {
  const email = envVars.SUPER_ADMIN_.EMAIL;
  const password = envVars.SUPER_ADMIN_.PASSWORD;

  if (!email || !password) {
    throw new Error('SUPER_ADMIN credentials missing in env');
  }

  try {
    seedLogger.info('Checking for existing super admin...');

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      seedLogger.warn('Super admin already exists. Skipping...');
      return;
    }

    seedLogger.info('Creating super admin...');

    const response = await fetch(`${envVars.BETTER_AUTH_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Super Admin',
        email,
        password,
        role: UserRole.SUPER_ADMIN,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AppError(response.status, `Failed to create super admin: ${errorText}`);
    }

    // mark email verified
    await prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    });

    seedLogger.info('Super admin created and verified successfully');
  } catch (err) {
    seedLogger.error('Seed failed', err);
  } finally {
    await prisma.$disconnect();
  }
}

seedSuperUser();

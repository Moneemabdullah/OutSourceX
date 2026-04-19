import { prisma } from '../lib/prisma.js';
import { UserRole } from '../../generated/prisma/enums.js';
import { envVars } from '../config/env.utils.js';
import AppError from '../errorHelpers/AppError.js';

async function seedSuperUser() {
  const email = envVars.SUPER_ADMIN_.EMAIL;
  const password = envVars.SUPER_ADMIN_.PASSWORD;

  if (!email || !password) {
    throw new Error('SUPER_ADMIN credentials missing in env');
  }

  try {
    console.log('🔍 Checking for existing super admin...');

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('⚠️ Super admin already exists. Skipping...');
      return;
    }

    console.log('🚀 Creating super admin...');

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

    console.log('✅ Super admin created & verified successfully');
  } catch (err) {
    console.error('❌ Seed failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

seedSuperUser();

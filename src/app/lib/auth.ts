import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { bearer, emailOTP } from 'better-auth/plugins';
import { prisma } from './prisma';

import { envVars } from '../config/env.utils.js';
import { sendEmail } from '../utils/emailService.js';
import { UserRole, UserStatus } from '../../generated/prisma/enums';

export const auth = betterAuth({
  baseURL: envVars.BETTER_AUTH_URL as string,
  secret: envVars.BETTER_AUTH_SECRET as string,
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  plugins: [
    bearer(),
    emailOTP({
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        if (type === 'email-verification') {
          const user = await prisma.user.findUnique({
            where: { email },
          });
          if (user && !user.emailVerified) {
            sendEmail({
              to: email,
              subject: 'Verify your email',
              template: 'otp',
              templateData: {
                name: user.name,
                otp,
              },
            });
          }
        } else if (type === 'forget-password') {
          const user = await prisma.user.findUnique({
            where: { email },
          });
          if (user) {
            sendEmail({
              to: email,
              subject: 'Reset your password',
              template: 'resetPassword',
              templateData: {
                name: user.name,
                otp,
              },
            });
          }
        }
      },
      expiresIn: 2 * 60 * 1000, // 2 minutes
      otpLength: 6,
    }),
  ],

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },

  socialProviders: {
    google: {
      clientId: envVars.GOOGLE_CLIENT_ID as string,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET as string,

      mapProfileToUser: () => {
        return {
          role: UserRole.FREELANCER,
          status: UserStatus.ACTIVE,
          needPasswordChange: false,
          isDeleted: false,
          DeletedAt: null,
        };
      },
    },
  },

  redirectURLs: {
    signIn: `${envVars.BETTER_AUTH_URL}/api/v1/auth/google/success`,
  },

  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
  },

  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: true,
        defaultValue: UserRole.FREELANCER,
      },
      status: {
        type: 'string',
        required: true,
        defaultValue: UserStatus.ACTIVE,
      },
      needPasswordChange: {
        type: 'boolean',
        required: true,
        defaultValue: false,
      },
      isDeleted: {
        type: 'boolean',
        required: true,
        defaultValue: false,
      },
      deletedAt: {
        type: 'date',
        required: false,
        defaultValue: null,
      },
    },
  },

  session: {
    expiresIn: Number(
      24 * 60 * 60 * 1000 // 1 day
    ),

    updateAge: Number(
      24 * 60 * 60 * 1000 // 1 day
    ),
    cookieCache: {
      enabled: true,
      maxAge: Number(
        24 * 60 * 60 * 1000 // 1 day
      ),
    },
  },

  advanced: {
    useSecureCookies: false,
    cookies: {
      state: {
        attributes: {
          sameSite: 'none',
          secure: true,
          httpOnly: true,
          path: '/',
        },
      },
      sessionToken: {
        attributes: {
          sameSite: 'none',
          secure: true,
          httpOnly: true,
          path: '/',
        },
      },
    },
  },
  trustedOrigin: [envVars.FRONTEND_URL as string, envVars.BETTER_AUTH_URL as string],
});

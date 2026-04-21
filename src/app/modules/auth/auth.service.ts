import httpStatus from 'http-status';
import { ILoginUser, IRegisterUser } from './user.interface';

import { Prisma, UserRole, UserStatus } from '../../../generated/prisma/browser';
import AppError from '../../errorHelpers/AppError';
import { IRequestUser } from '../../interfaces/requestUser.interface';
import { auth } from '../../lib/auth';
import { createLogger } from '../../lib/logger';
import { prisma } from '../../lib/prisma';
import { sendEmail } from '../../utils/emailService';
import { tokenUtils } from '../../utils/token';

const authLogger = createLogger('AuthService');

type TAuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  isDeleted: boolean;
  emailVerified: boolean;
};

const issueTokens = (user: TAuthUser) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    isDeleted: user.isDeleted,
    emailVerified: user.emailVerified,
  };

  return {
    accessToken: tokenUtils.getAccessToken(payload),
    refreshToken: tokenUtils.getRefreshToken(payload),
  };
};

const ensureAccountProfile = async (
  tx: Prisma.TransactionClient,
  userId: string,
  role: UserRole
) => {
  const user = await tx.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    authLogger.error('User not found in database during profile creation', { userId });
    throw new AppError(400, 'User not found in database (sync issue)');
  }

  if (role === UserRole.CLIENT) {
    await tx.client.upsert({
      where: { userID: userId },
      update: {},
      create: { userID: userId },
    });
  }

  if (role === UserRole.FREELANCER) {
    await tx.freelancer.upsert({
      where: { userID: userId },
      update: {},
      create: { userID: userId },
    });
  }
};

const registerUser = async (payload: IRegisterUser) => {
  const response = (await auth.api.signUpEmail({
    body: {
      email: payload.email,
      password: payload.password,
      name: payload.name,
      role: payload.role,
    },
  })) as { user?: TAuthUser };

  if (!response.user) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to register user');
  }
  const createdUser = response.user;

  await prisma.$transaction(async (tx) => {
    await ensureAccountProfile(tx, createdUser.id, createdUser.role);
    return createdUser;
  });

  await sendEmail({
    to: createdUser.email,
    subject: 'Welcome to OutsourceX',
    template: 'welcome',
    templateData: {
      name: createdUser.name,
      role: createdUser.role,
    },
  });

  authLogger.info('New user registered', { userId: response.user.id, email: response.user.email });

  const tokenUser: TAuthUser = {
    id: createdUser.id,
    email: createdUser.email,
    name: createdUser.name || '',
    role: createdUser.role,
    status: createdUser.status,
    isDeleted: createdUser.isDeleted,
    emailVerified: createdUser.emailVerified,
  };

  return {
    user: response.user,
    ...issueTokens(tokenUser),
  };
};

const loginUser = async (payload: ILoginUser) => {
  const response = await auth.api.signInEmail({
    body: {
      email: payload.email,
      password: payload.password,
    },
  });

  if (!response.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid email or password');
  }
  const signedInUser = response.user;

  if (signedInUser.status === UserStatus.SUSPENDED || signedInUser.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'This account is not allowed to sign in');
  }

  await prisma.$transaction(async (tx) => {
    await ensureAccountProfile(tx, signedInUser.id, signedInUser.role as UserRole);
  });

  return {
    user: response,
    ...issueTokens(signedInUser as TAuthUser),
  };
};

const logoutUser = async (headers?: HeadersInit) => {
  return auth.api.signOut({
    headers,
  });
};

const getGoogleOAuthUrl = async (payload?: {
  callbackURL?: string;
  newUserCallbackURL?: string;
  errorCallbackURL?: string;
}) => {
  const response = (await auth.api.signInSocial({
    body: {
      provider: 'google',
      disableRedirect: true,
      callbackURL: payload?.callbackURL,
      newUserCallbackURL: payload?.newUserCallbackURL,
      errorCallbackURL: payload?.errorCallbackURL,
    },
  })) as { url?: string };

  if (!response.url) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to initialize Google OAuth');
  }

  return response;
};

const changePassword = async (
  user: IRequestUser,
  payload: {
    currentPassword: string;
    newPassword: string;
    revokeOtherSessions?: boolean;
  },
  headers?: HeadersInit
) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: user.userId },
  });

  if (!existingUser) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  return auth.api.changePassword({
    body: {
      currentPassword: payload.currentPassword,
      newPassword: payload.newPassword,
      revokeOtherSessions: payload.revokeOtherSessions,
    },
    headers,
  });
};

const verifyEmail = async (payload: { email: string; otp: string }) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (user.emailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Email already verified');
  }
  return auth.api.verifyEmailOTP({
    body: {
      email: payload.email,
      otp: payload.otp,
    },
  });
};

const forgotPassword = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (user.isDeleted || user.status === UserStatus.SUSPENDED) {
    throw new AppError(httpStatus.FORBIDDEN, 'This account is not allowed to reset password');
  }

  return auth.api.requestPasswordResetEmailOTP({
    body: {
      email,
    },
  });
};

const resetPassword = async (payload: { email: string; otp: string; password: string }) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  return auth.api.resetPasswordEmailOTP({
    body: {
      email: payload.email,
      otp: payload.otp,
      password: payload.password,
    },
  });
};

const getMe = async (user: IRequestUser) => {
  const account = await prisma.user.findUnique({
    where: { id: user.userId },
    include: {
      clients: true,
      freelancers: {
        include: {
          expertise: true,
        },
      },
      notifications: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      },
    },
  });

  if (!account) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  return account;
};

export const authService = {
  registerUser,
  loginUser,
  logoutUser,
  getGoogleOAuthUrl,
  changePassword,
  forgotPassword,
  resetPassword,
  getMe,
  verifyEmail,
};

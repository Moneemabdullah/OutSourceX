import httpStatus from 'http-status';
import { ILoginUser, IRegisterUser } from './user.interface';

import { tokenUtils } from '../../utils/token';
import { auth } from '../../lib/auth';
import AppError from '../../errorHelpers/AppError';
import { sendEmail } from '../../utils/emailService';
import { IRequestUser } from '../../interfaces/requestUser.interface';
import { prisma } from '../../lib/prisma';
import { Prisma, UserRole, UserStatus } from '../../../generated/prisma/browser';

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

  await prisma.$transaction(async (tx) => {
    await ensureAccountProfile(tx, response.user!.id, response.user!.role);
    return response.user;
  });

  await sendEmail({
    to: response.user!.email,
    subject: 'Welcome to OutsourceX',
    template: 'welcome',
    templateData: {
      name: response.user!.name,
      role: response.user!.role,
    },
  });

  const tokenUser: TAuthUser = {
    id: response.user!.id,
    email: response.user!.email,
    name: response.user!.name || '',
    role: response.user!.role,
    status: response.user!.status,
    isDeleted: response.user!.isDeleted,
    emailVerified: response.user!.emailVerified,
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

  if (response.user.status === UserStatus.SUSPENDED || response.user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'This account is not allowed to sign in');
  }

  await prisma.$transaction(async (tx) => {
    await ensureAccountProfile(tx, response.user!.id, response.user!.role as UserRole);
  });

  return {
    user: response,
    ...issueTokens(response.user as TAuthUser),
  };
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
  getGoogleOAuthUrl,
  changePassword,
  forgotPassword,
  resetPassword,
  getMe,
};

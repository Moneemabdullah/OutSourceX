import AppError from '@/app/errorHelpers/AppError';
import { IRequestUser } from '@/app/interfaces/requestUser.interface';
import { auth } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { sendEmail } from '@/app/utils/emailService';
import { tokenUtils } from '@/app/utils/token';
import { UserRole, UserStatus } from '@/generated/prisma/enums';
import httpStatus from 'http-status';
import { ILoginUser, IRegisterUser } from './user.interface';

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

const ensureAccountProfile = async (userId: string, role: UserRole) => {
  if (role === UserRole.CLIENT) {
    const client = await prisma.client.findFirst({ where: { userID: userId } });

    if (!client) {
      await prisma.client.create({ data: { userID: userId } });
    }
  }

  if (role === UserRole.FREELANCER) {
    const freelancer = await prisma.freelancer.findFirst({ where: { userID: userId } });

    if (!freelancer) {
      await prisma.freelancer.create({ data: { userID: userId } });
    }
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

  await ensureAccountProfile(response.user.id, response.user.role);

  await sendEmail({
    to: response.user.email,
    subject: 'Welcome to OutsourceX',
    template: 'welcome',
    templateData: {
      name: response.user.name,
      role: response.user.role,
    },
  });

  return {
    user: response.user,
    ...issueTokens(response.user),
  };
};

const loginUser = async (payload: ILoginUser) => {
  const response = (await auth.api.signInEmail({
    body: {
      email: payload.email,
      password: payload.password,
    },
  })) as { user?: TAuthUser };

  if (!response.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid email or password');
  }

  if (response.user.status === UserStatus.SUSPENDED || response.user.isDeleted) {
    throw new AppError(httpStatus.FORBIDDEN, 'This account is not allowed to sign in');
  }

  await ensureAccountProfile(response.user.id, response.user.role);

  return {
    user: response.user,
    ...issueTokens(response.user),
  };
};

const getGoogleOAuthUrl = async () => {
  const response = (await auth.api.signInSocial({
    body: {
      provider: 'google',
      disableRedirect: true,
    },
  })) as { url?: string };

  if (!response.url) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to initialize Google OAuth');
  }

  return response;
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
  getMe,
};

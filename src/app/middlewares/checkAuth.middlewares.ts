import { NextFunction, Request, Response } from 'express';
import status from 'http-status';
import { UserRole, UserStatus } from '../../generated/prisma/enums';
import { envVars } from '../config/env.utils';
import AppError from '../errorHelpers/AppError';
import { prisma } from '../lib/prisma';
import { cookieUtils } from '../utils/cookie';
import { jwtUtils } from '../utils/jwt';

const sessionCookieKeys = [
  'better-auth.session_token',
  'better-auth-session-token',
  'better-auth-session',
];

const ensureRole = (role: UserRole, authRoles: UserRole[]) => {
  if (authRoles.length > 0 && !authRoles.includes(role)) {
    throw new AppError(status.FORBIDDEN, 'Forbidden: insufficient permissions');
  }
};

export const CheckAuth =
  (...authRoles: UserRole[]) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
      const accessToken = bearerToken ?? cookieUtils.getCookie(req, 'accessToken');

      if (accessToken) {
        const verifiedToken = jwtUtils.verifyToken(
          accessToken,
          envVars.ACCESS_TOKEN_SECRET as string
        );

        if (verifiedToken.success && verifiedToken.data && typeof verifiedToken.data !== 'string') {
          const payload = verifiedToken.data as {
            userId?: string;
            email?: string;
            role?: UserRole;
          };

          if (!payload.userId || !payload.email || !payload.role) {
            throw new AppError(status.UNAUTHORIZED, 'Unauthorized access');
          }

          ensureRole(payload.role, authRoles);

          req.user = {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
          };

          return next();
        }
      }

      const sessionToken = sessionCookieKeys
        .map((key) => cookieUtils.getCookie(req, key))
        .find(Boolean);

      if (!sessionToken) {
        throw new AppError(status.UNAUTHORIZED, 'Unauthorized access');
      }

      const session = (await prisma.session.findFirst({
        where: { sessionToken },
        include: { user: true },
      })) as
        | ({
            user: {
              id: string;
              email: string;
              role: UserRole;
              status: UserStatus;
              isDeleted: boolean;
            };
          } & { expires: Date })
        | null;

      if (!session || session.expires <= new Date()) {
        throw new AppError(status.UNAUTHORIZED, 'Session expired or invalid');
      }

      if (session.user.status === UserStatus.SUSPENDED || session.user.isDeleted) {
        throw new AppError(status.FORBIDDEN, 'Your account is not allowed to access this resource');
      }

      ensureRole(session.user.role as UserRole, authRoles);

      req.user = {
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role as UserRole,
      };

      return next();
    } catch (error) {
      return next(error);
    }
  };

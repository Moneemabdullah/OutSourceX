import { NextFunction, Request, Response } from 'express';
import status from 'http-status';

import { UserRole, UserStatus } from '../../generated/prisma/enums';
import { envVars } from '../config/env.utils';
import AppError from '../errorHelpers/AppError';
import { prisma } from '../lib/prisma';
import { cookieUtils } from '../utils/cookie';
import { jwtUtils } from '../utils/jwt';

export const CheckAuth =
  (...authRoles: UserRole[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionToken = cookieUtils.getCookie(req, 'better-auth-session-token');

      if (!sessionToken) {
        throw new AppError(status.UNAUTHORIZED, 'Unauthorized: No session token provided');
      }
      if (sessionToken) {
        const sessionExists = await prisma.session.findFirst({
          where: {
            token: sessionToken,
            expiresAt: {
              gt: new Date(),
            },
          },
          include: {
            user: true,
          },
        });

        if (sessionExists && sessionExists.user) {
          const user = sessionExists.user;

          const now = new Date();
          const expiresAt = new Date(sessionExists.expiresAt);
          const createdAt = new Date(sessionExists.createdAt);

          const sessionLifeTime = expiresAt.getTime() - createdAt.getTime();

          const timeLeft = expiresAt.getTime() - now.getTime();

          const percentageLeft = (timeLeft / sessionLifeTime) * 100;

          if (percentageLeft < 20) {
            res.setHeader('X-Session-Expiring', 'true');
            res.setHeader('X-Session-Expires-At', expiresAt.toISOString());
            res.setHeader('X-Time-remaining', timeLeft.toString());
          }

          if (user.status === UserStatus.SUSPENDED) {
            throw new AppError(
              status.FORBIDDEN,
              'Your account is suspended. Please contact support.'
            );
          }

          if (user.isDeleted) {
            throw new AppError(
              status.FORBIDDEN,
              'Your account is deleted. Please contact support.'
            );
          }

          if (authRoles.length > 0 && !authRoles.includes(user.role as UserRole)) {
            throw new AppError(status.FORBIDDEN, 'Forbidden: Insufficient permissions');
          }

          req.user = {
            userId: user.id,
            role: user.role as UserRole,
            email: user.email,
          };
        }

        const accessToken = cookieUtils.getCookie(req, 'accessToken');

        if (!accessToken) {
          throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! No access token provided.');
        }
      }
      //Access Token Verification
      const accessToken = cookieUtils.getCookie(req, 'accessToken');

      if (!accessToken) {
        throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! No access token provided.');
      }

      const verifiedToken = jwtUtils.verifyToken(
        accessToken,
        envVars.ACCESS_TOKEN_SECRET as string
      );

      if (!verifiedToken.success) {
        throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! Invalid access token.');
      }

      const tokenPayload = verifiedToken.data;
      const tokenRole =
        typeof tokenPayload === 'object' && tokenPayload !== null && 'role' in tokenPayload
          ? tokenPayload.role
          : undefined;

      if (!tokenRole) {
        throw new AppError(status.UNAUTHORIZED, 'Unauthorized access! Invalid token payload.');
      }

      if (authRoles.length > 0 && !authRoles.includes(tokenRole as UserRole)) {
        throw new AppError(
          status.FORBIDDEN,
          'Forbidden access! You do not have permission to access this resource.'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };

import catchAsync from '@/app/shared/catchAsync';
import { sendResponse } from '@/app/shared/sendResponse';
import { tokenUtils } from '@/app/utils/token';
import AppError from '@/app/errorHelpers/AppError';
import { Request, Response } from 'express';
import status from 'http-status';
import { authService } from './auth.service';

const registerUser = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.registerUser(req.body);

  tokenUtils.setAccessToken(res, result.accessToken);
  tokenUtils.setRefreshToken(res, result.refreshToken);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.loginUser(req.body);

  tokenUtils.setAccessToken(res, result.accessToken);
  tokenUtils.setRefreshToken(res, result.refreshToken);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'User logged in successfully',
    data: result,
  });
});

const getGoogleOAuthUrl = catchAsync(async (_req: Request, res: Response) => {
  const result = await authService.getGoogleOAuthUrl();

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Google OAuth URL generated successfully',
    data: result,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(status.UNAUTHORIZED, 'Unauthorized access');
  }

  const result = await authService.getMe(req.user);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Authenticated user fetched successfully',
    data: result,
  });
});

export const authController = {
  registerUser,
  loginUser,
  getGoogleOAuthUrl,
  getMe,
};

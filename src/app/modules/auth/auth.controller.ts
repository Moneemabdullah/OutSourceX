import { Request, Response } from 'express';
import status from 'http-status';
import { authService } from './auth.service';
import { sendResponse } from '../../shared/sendResponse';
import { tokenUtils } from '../../utils/token';
import catchAsync from '../../shared/catchAsync';
import AppError from '../../errorHelpers/AppError';

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

  const { accessToken, refreshToken, user } = result;

  tokenUtils.setAccessToken(res, accessToken);
  tokenUtils.setRefreshToken(res, refreshToken);
  tokenUtils.setBetterAuthSessionCookies(res, user.token);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'User logged in successfully',
    data: result.user,
  });
});

const getGoogleOAuthUrl = catchAsync(async (_req: Request, res: Response) => {
  const result = await authService.getGoogleOAuthUrl({
    callbackURL: typeof _req.query.callbackURL === 'string' ? _req.query.callbackURL : undefined,
    newUserCallbackURL:
      typeof _req.query.newUserCallbackURL === 'string' ? _req.query.newUserCallbackURL : undefined,
    errorCallbackURL:
      typeof _req.query.errorCallbackURL === 'string' ? _req.query.errorCallbackURL : undefined,
  });

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Google OAuth URL generated successfully',
    data: result,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(status.UNAUTHORIZED, 'Unauthorized access');
  }

  const result = await authService.changePassword(req.user, req.body, req.headers as HeadersInit);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Password changed successfully',
    data: result,
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.forgotPassword(req.body.email);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Password reset OTP sent successfully',
    data: result,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.resetPassword(req.body);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'Password reset successfully',
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
  changePassword,
  forgotPassword,
  resetPassword,
  getMe,
};

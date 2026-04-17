import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { profileService } from './service';
import catchAsync from '../../shared/catchAsync';
import AppError from '../../errorHelpers/AppError';
import { sendResponse } from '../../shared/sendResponse';

const upsertMyProfile = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized access');
  }

  const result = await profileService.upsertMyProfile(req.user, req.body);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: 'Profile updated successfully',
    data: result,
  });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized access');
  }

  const result = await profileService.getMyProfile(req.user);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: 'Profile fetched successfully',
    data: result,
  });
});

export const profileController = {
  upsertMyProfile,
  getMyProfile,
};

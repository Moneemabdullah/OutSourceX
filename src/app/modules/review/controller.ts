import AppError from '@/app/errorHelpers/AppError';
import catchAsync from '@/app/shared/catchAsync';
import { sendResponse } from '@/app/shared/sendResponse';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { reviewService } from './service';

const createReview = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized access');
  }

  const result = await reviewService.createReview(req.user, req.body);

  sendResponse(res, {
    httpStatusCode: httpStatus.CREATED,
    success: true,
    message: 'Review submitted successfully',
    data: result,
  });
});

export const reviewController = {
  createReview,
};

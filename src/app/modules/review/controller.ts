import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { reviewService } from './service';
import catchAsync from '../../shared/catchAsync';
import AppError from '../../errorHelpers/AppError';
import { sendResponse } from '../../shared/sendResponse';

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

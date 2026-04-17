import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { paymentService } from './service';
import catchAsync from '../../shared/catchAsync';
import AppError from '../../errorHelpers/AppError';
import { sendResponse } from '../../shared/sendResponse';

const createEscrowPayment = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized access');
  }

  const result = await paymentService.createEscrowPayment(req.user, req.body);

  sendResponse(res, {
    httpStatusCode: httpStatus.CREATED,
    success: true,
    message: 'Escrow funded successfully',
    data: result,
  });
});

const releasePayment = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized access');
  }

  const result = await paymentService.releasePayment(req.user, String(req.params.paymentId));

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: 'Payment released successfully',
    data: result,
  });
});

export const paymentController = {
  createEscrowPayment,
  releasePayment,
};

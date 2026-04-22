import { Request, Response } from 'express';
import httpStatus from 'http-status';

import AppError from '../../errorHelpers/AppError';
import { IQueryParams } from '../../interfaces/Query.interface';
import catchAsync from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { userService } from './service';

const getMyAccount = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized access');
  }

  const result = await userService.getMyAccount(req.user);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: 'Account fetched successfully',
    data: result,
  });
});

const updateMyAccount = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized access');
  }

  const result = await userService.updateMyAccount(req.user, req.body);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: 'Account updated successfully',
    data: result,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.getAllUsers(req.query as unknown as IQueryParams);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: 'Users fetched successfully',
    data: result,
  });
});

const getFreelancers = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.getFreelancers(req.query as unknown as IQueryParams);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: 'Freelancers fetched successfully',
    data: result,
  });
});

const getFreelancerById = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.getFreelancerById(String(req.params.freelancerId));

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: 'Freelancer fetched successfully',
    data: result,
  });
});

const getDashboard = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized access');
  }

  const result = await userService.getDashboard(req.user);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: 'Dashboard fetched successfully',
    data: result,
  });
});

const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createAdmin(req.body);

  sendResponse(res, {
    httpStatusCode: httpStatus.CREATED,
    success: true,
    message: 'Admin created successfully',
    data: result,
  });
});

const promoteAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.promoteAdmin(req.body);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: 'Admin created successfully',
    data: result,
  });
});

const demoteAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.demoteAdmin(String(req.params.userId), req.body);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: 'Admin removed successfully',
    data: result,
  });
});

const getTransactions = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.getTransactions(req.query as unknown as IQueryParams);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: 'Transactions fetched successfully',
    data: result,
  });
});

const getDisputes = catchAsync(async (_req: Request, res: Response) => {
  const result = await userService.getDisputes();

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: 'Disputes fetched successfully',
    data: result,
  });
});

export const userController = {
  getFreelancers,
  getFreelancerById,
  getMyAccount,
  updateMyAccount,
  getAllUsers,
  getDashboard,
  createAdmin,
  promoteAdmin,
  demoteAdmin,
  getTransactions,
  getDisputes,
};

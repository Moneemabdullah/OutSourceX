import AppError from '@/app/errorHelpers/AppError';
import catchAsync from '@/app/shared/catchAsync';
import { sendResponse } from '@/app/shared/sendResponse';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { milestoneService } from './service';

const createMilestone = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized access');
  }

  const result = await milestoneService.createMilestone(req.user, req.body);

  sendResponse(res, {
    httpStatusCode: httpStatus.CREATED,
    success: true,
    message: 'Milestone created successfully',
    data: result,
  });
});

const updateMilestoneStatus = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized access');
  }

  const result = await milestoneService.updateMilestoneStatus(
    req.user,
    String(req.params.milestoneId),
    req.body
  );

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: 'Milestone updated successfully',
    data: result,
  });
});

const getContractMilestones = catchAsync(async (req: Request, res: Response) => {
  const result = await milestoneService.getContractMilestones(String(req.params.contractId));

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: 'Milestones fetched successfully',
    data: result,
  });
});

export const milestoneController = {
  createMilestone,
  updateMilestoneStatus,
  getContractMilestones,
};

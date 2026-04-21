import { Request, Response } from 'express';
import httpStatus from 'http-status';
import AppError from '../../errorHelpers/AppError';
import { IQueryParams } from '../../interfaces/Query.interface';
import catchAsync from '../../shared/catchAsync';
import { sendResponse } from '../../shared/sendResponse';
import { jobService } from './service';

const createJob = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized access');
  }

  const result = await jobService.createJob(req.user, req.body);

  sendResponse(res, {
    httpStatusCode: httpStatus.CREATED,
    success: true,
    message: 'Job created successfully',
    data: result,
  });
});

const updateJob = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized access');
  }

  const result = await jobService.updateJob(req.user, String(req.params.jobId), req.body);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: 'Job updated successfully',
    data: result,
  });
});

const deleteJob = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized access');
  }

  const result = await jobService.deleteJob(req.user, String(req.params.jobId));

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: 'Job deleted successfully',
    data: result,
  });
});

const getJobs = catchAsync(async (req: Request, res: Response) => {
  const result = await jobService.getJobs(req.query as unknown as IQueryParams);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: 'Jobs fetched successfully',
    data: result,
  });
});

const getJob = catchAsync(async (req: Request, res: Response) => {
  const result = await jobService.getJob(String(req.params.jobId));

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: 'Job fetched successfully',
    data: result,
  });
});

export const jobController = {
  createJob,
  updateJob,
  deleteJob,
  getJobs,
  getJob,
};

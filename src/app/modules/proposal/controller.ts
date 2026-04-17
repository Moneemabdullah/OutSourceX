import AppError from '@/app/errorHelpers/AppError';
import { IQueryParams } from '@/app/interfaces/Query.interface';
import catchAsync from '@/app/shared/catchAsync';
import { sendResponse } from '@/app/shared/sendResponse';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { proposalService } from './service';

const applyToJob = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized access');
  }

  const result = await proposalService.applyToJob(req.user, req.body);

  sendResponse(res, {
    httpStatusCode: httpStatus.CREATED,
    success: true,
    message: 'Proposal submitted successfully',
    data: result,
  });
});

const acceptProposal = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized access');
  }

  const result = await proposalService.acceptProposal(req.user, String(req.params.proposalId));

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: 'Proposal accepted successfully',
    data: result,
  });
});

const getJobProposals = catchAsync(async (req: Request, res: Response) => {
  const result = await proposalService.getJobProposals(
    String(req.params.jobId),
    req.query as unknown as IQueryParams
  );

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: 'Proposals fetched successfully',
    data: result,
  });
});

const getProposals = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized access');
  }

  const result = await proposalService.getProposals(req.user, req.query as unknown as IQueryParams);

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: 'Proposals fetched successfully',
    data: result,
  });
});

export const proposalController = {
  applyToJob,
  acceptProposal,
  getJobProposals,
  getProposals,
};

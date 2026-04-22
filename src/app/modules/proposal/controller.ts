import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { proposalService } from './service';
import { sendResponse } from '../../shared/sendResponse';
import AppError from '../../errorHelpers/AppError';
import catchAsync from '../../shared/catchAsync';
import { IQueryParams } from '../../interfaces/Query.interface';

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
    message: 'Proposal accepted and contract created',
    data: result,
  });
});

const rejectProposal = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized access');
  }

  const result = await proposalService.rejectProposal(req.user, String(req.params.proposalId));

  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: 'Proposal rejected',
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
  rejectProposal,
  getJobProposals,
  getProposals,
};

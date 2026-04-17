import httpStatus from 'http-status';
import { IRequestUser } from '../../interfaces/requestUser.interface';
import { prisma } from '../../lib/prisma';
import AppError from '../../errorHelpers/AppError';

const createMilestone = async (
  user: IRequestUser,
  payload: {
    contractID: string;
    title: string;
    description?: string;
    amount: number;
    dueDate?: string;
  }
) => {
  const contract = await prisma.contract.findUnique({
    where: { id: payload.contractID },
    include: {
      client: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!contract) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contract not found');
  }

  if (contract.client.user.id !== user.userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'Only the client can create milestones');
  }

  if (payload.dueDate && new Date(payload.dueDate) <= new Date()) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Due date must be in the future');
  }

  const duplicateMilestone = await prisma.milestone.findFirst({
    where: {
      jobID: contract.jobID,
      title: payload.title,
    },
  });

  if (duplicateMilestone) {
    throw new AppError(httpStatus.CONFLICT, 'Milestone title already exists for this contract');
  }

  return prisma.milestone.create({
    data: {
      jobID: contract.jobID,
      title: payload.title,
      description: payload.description,
      amount: payload.amount,
      dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
    },
  });
};

const updateMilestoneStatus = async (
  user: IRequestUser,
  milestoneId: string,
  payload: { milestoneStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' }
) => {
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    include: {
      job: {
        include: {
          owner: {
            include: {
              user: true,
            },
          },
          contracts: {
            include: {
              freelancer: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!milestone) {
    throw new AppError(httpStatus.NOT_FOUND, 'Milestone not found');
  }

  const contract = milestone.job.contracts[0];
  const isClient = milestone.job.owner.user.id === user.userId;
  const isFreelancer = contract?.freelancer.user.id === user.userId;

  if (!isClient && !isFreelancer) {
    throw new AppError(httpStatus.FORBIDDEN, 'You cannot update this milestone');
  }

  if (milestone.milestoneStatus === 'COMPLETED' && payload.milestoneStatus !== 'COMPLETED') {
    throw new AppError(httpStatus.BAD_REQUEST, 'Completed milestones cannot move to another state');
  }

  return prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      milestoneStatus: payload.milestoneStatus,
    },
  });
};

const getContractMilestones = async (contractId: string) => {
  const contract = await prisma.contract.findUnique({
    where: { id: contractId },
  });

  if (!contract) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contract not found');
  }

  return prisma.milestone.findMany({
    where: { jobID: contract.jobID },
    orderBy: {
      createdAt: 'asc',
    },
  });
};

export const milestoneService = {
  createMilestone,
  updateMilestoneStatus,
  getContractMilestones,
};

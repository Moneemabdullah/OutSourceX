import AppError from '@/app/errorHelpers/AppError';
import { IRequestUser } from '@/app/interfaces/requestUser.interface';
import { prisma } from '@/app/lib/prisma';
import httpStatus from 'http-status';

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
  _user: IRequestUser,
  milestoneId: string,
  payload: { milestoneStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' }
) => {
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

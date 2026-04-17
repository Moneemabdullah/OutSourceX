import AppError from '@/app/errorHelpers/AppError';
import { IQueryParams } from '@/app/interfaces/Query.interface';
import { IRequestUser } from '@/app/interfaces/requestUser.interface';
import { prisma } from '@/app/lib/prisma';
import { QueryBuilder } from '@/app/utils/QueryBuilder';
import { notificationUtils } from '@/app/utils/notification';
import httpStatus from 'http-status';

const createContractFromProposal = async (
  user: IRequestUser,
  payload: { proposalID: string; title: string; description?: string }
) => {
  const proposal = await prisma.proposal.findUnique({
    where: { id: payload.proposalID },
    include: {
      job: {
        include: {
          owner: {
            include: {
              user: true,
            },
          },
        },
      },
      freelancer: {
        include: {
          user: true,
        },
      },
      contract: true,
    },
  });

  if (!proposal) {
    throw new AppError(httpStatus.NOT_FOUND, 'Proposal not found');
  }

  if (proposal.status !== 'ACCEPTED') {
    throw new AppError(httpStatus.BAD_REQUEST, 'Only accepted proposals can become contracts');
  }

  if (proposal.job.owner.user.id !== user.userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You cannot create a contract for this proposal');
  }

  if (proposal.contract) {
    throw new AppError(httpStatus.CONFLICT, 'A contract already exists for this proposal');
  }

  const duplicateContract = await prisma.contract.findFirst({
    where: {
      proposalID: proposal.id,
    },
  });

  if (duplicateContract) {
    throw new AppError(httpStatus.CONFLICT, 'A contract already exists for this proposal');
  }

  const contract = await prisma.contract.create({
    data: {
      title: payload.title,
      description: payload.description,
      jobID: proposal.jobID,
      proposalID: proposal.id,
      clientID: proposal.job.ownerID,
      freelancerID: proposal.freelancerID,
    },
    include: {
      job: true,
      freelancer: {
        include: {
          user: true,
        },
      },
      client: {
        include: {
          user: true,
        },
      },
    },
  });

  await notificationUtils.createNotification({
    userId: proposal.freelancer.user.id,
    title: 'Contract created',
    message: `A contract has been created for "${proposal.job.title}".`,
  });

  return contract;
};

const getContracts = async (user: IRequestUser, query: IQueryParams) => {
  const queryBuilder = new QueryBuilder(prisma.contract, query, {
    searchableFields: [
      'title',
      'description',
      'job.title',
      'freelancer.user.name',
      'client.user.name',
    ],
    filterableFields: ['jobID', 'proposalID', 'freelancerID', 'clientID'],
  });

  return queryBuilder
    .where({
      OR: [
        {
          client: {
            userID: user.userId,
          },
        },
        {
          freelancer: {
            userID: user.userId,
          },
        },
      ],
    })
    .search()
    .filter()
    .sort()
    .paginate()
    .include({
      job: true,
      freelancer: {
        include: {
          user: true,
        },
      },
      client: {
        include: {
          user: true,
        },
      },
    })
    .execute();
};

export const contractService = {
  createContractFromProposal,
  getContracts,
};

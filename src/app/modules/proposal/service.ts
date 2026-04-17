import AppError from '@/app/errorHelpers/AppError';
import { IQueryParams } from '@/app/interfaces/Query.interface';
import { IRequestUser } from '@/app/interfaces/requestUser.interface';
import { prisma } from '@/app/lib/prisma';
import { sendEmail } from '@/app/utils/emailService';
import { QueryBuilder } from '@/app/utils/QueryBuilder';
import { notificationUtils } from '@/app/utils/notification';
import httpStatus from 'http-status';

const getFreelancerProfileId = async (userId: string) => {
  const freelancer = await prisma.freelancer.findFirst({
    where: { userID: userId },
  });

  if (!freelancer) {
    throw new AppError(httpStatus.NOT_FOUND, 'Freelancer profile not found');
  }

  return freelancer.id;
};

const applyToJob = async (
  user: IRequestUser,
  payload: { jobID: string; coverLetter: string; bidAmount: number }
) => {
  const freelancerId = await getFreelancerProfileId(user.userId);

  const existingProposal = await prisma.proposal.findFirst({
    where: {
      jobID: payload.jobID,
      freelancerID: freelancerId,
    },
  });

  if (existingProposal) {
    throw new AppError(httpStatus.CONFLICT, 'You have already applied to this job');
  }

  const job = await prisma.job.findUnique({
    where: { id: payload.jobID },
    include: {
      owner: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!job) {
    throw new AppError(httpStatus.NOT_FOUND, 'Job not found');
  }

  if (job.owner.user.id === user.userId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'You cannot submit a proposal to your own job');
  }

  const proposal = await prisma.proposal.create({
    data: {
      jobID: payload.jobID,
      freelancerID: freelancerId,
      coverLetter: payload.coverLetter,
      bidAmount: payload.bidAmount,
    },
  });

  await notificationUtils.createNotification({
    userId: job.owner.user.id,
    title: 'New proposal received',
    message: `A freelancer submitted a proposal for "${job.title}".`,
  });

  return proposal;
};

const acceptProposal = async (user: IRequestUser, proposalId: string) => {
  const proposal = await prisma.proposal.findUnique({
    where: { id: proposalId },
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
    },
  });

  if (!proposal) {
    throw new AppError(httpStatus.NOT_FOUND, 'Proposal not found');
  }

  if (proposal.status === 'ACCEPTED') {
    throw new AppError(httpStatus.BAD_REQUEST, 'Proposal has already been accepted');
  }

  if (proposal.status === 'REJECTED') {
    throw new AppError(httpStatus.BAD_REQUEST, 'Rejected proposals cannot be accepted');
  }

  if (proposal.job.owner.user.id !== user.userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'You cannot accept this proposal');
  }

  await prisma.proposal.updateMany({
    where: {
      jobID: proposal.jobID,
      id: {
        not: proposalId,
      },
    },
    data: {
      status: 'REJECTED',
    },
  });

  const acceptedProposal = await prisma.proposal.update({
    where: { id: proposalId },
    data: {
      status: 'ACCEPTED',
    },
  });

  await notificationUtils.createNotification({
    userId: proposal.freelancer.user.id,
    title: 'Proposal accepted',
    message: `Your proposal for "${proposal.job.title}" has been accepted.`,
  });

  await sendEmail({
    to: proposal.freelancer.user.email,
    subject: 'Proposal accepted',
    template: 'proposalAccepted',
    templateData: {
      name: proposal.freelancer.user.name,
      jobTitle: proposal.job.title,
      bidAmount: proposal.bidAmount,
    },
  });

  return acceptedProposal;
};

const getJobProposals = async (jobId: string, query: IQueryParams) => {
  const queryBuilder = new QueryBuilder(prisma.proposal, query, {
    searchableFields: ['coverLetter', 'freelancer.user.name', 'job.title'],
    filterableFields: ['status', 'jobID', 'freelancerID', 'bidAmount'],
  });

  return queryBuilder
    .where({ jobID: jobId })
    .search()
    .filter()
    .sort()
    .paginate()
    .include({
      freelancer: {
        include: {
          user: true,
          expertise: true,
        },
      },
      job: true,
    })
    .execute();
};

const getProposals = async (user: IRequestUser, query: IQueryParams) => {
  const queryBuilder = new QueryBuilder(prisma.proposal, query, {
    searchableFields: ['coverLetter', 'freelancer.user.name', 'job.title'],
    filterableFields: ['status', 'jobID', 'freelancerID', 'bidAmount'],
  });

  const baseWhere =
    user.role === 'FREELANCER'
      ? {
          freelancer: {
            userID: user.userId,
          },
        }
      : {
          job: {
            owner: {
              userID: user.userId,
            },
          },
        };

  return queryBuilder
    .where(baseWhere)
    .search()
    .filter()
    .sort()
    .paginate()
    .include({
      freelancer: {
        include: {
          user: true,
          expertise: true,
        },
      },
      job: {
        include: {
          owner: {
            include: {
              user: true,
            },
          },
        },
      },
    })
    .execute();
};

export const proposalService = {
  applyToJob,
  acceptProposal,
  getJobProposals,
  getProposals,
};

import AppError from '@/app/errorHelpers/AppError';
import { IRequestUser } from '@/app/interfaces/requestUser.interface';
import { prisma } from '@/app/lib/prisma';
import { sendEmail } from '@/app/utils/emailService';
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

const getJobProposals = async (jobId: string) => {
  return prisma.proposal.findMany({
    where: { jobID: jobId },
    include: {
      freelancer: {
        include: {
          user: true,
          expertise: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

export const proposalService = {
  applyToJob,
  acceptProposal,
  getJobProposals,
};

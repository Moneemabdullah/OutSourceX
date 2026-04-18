import httpStatus from 'http-status';
import { IRequestUser } from '../../interfaces/requestUser.interface';
import { UserRole } from '../../../generated/prisma/enums';
import { prisma } from '../../lib/prisma';
import AppError from '../../errorHelpers/AppError';
import { notificationUtils } from '../../utils/notification';

const createReview = async (
  user: IRequestUser,
  payload: { clientID?: string; freelancerID?: string; rating: number; comment?: string }
) => {
  if (user.role === UserRole.CLIENT) {
    const client = await prisma.client.findFirst({
      where: { userID: user.userId },
    });

    if (!client || !payload.freelancerID) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Freelancer review target is required');
    }

    const freelancer = await prisma.freelancer.findUnique({
      where: { id: payload.freelancerID },
      include: { user: true },
    });

    if (!freelancer) {
      throw new AppError(httpStatus.NOT_FOUND, 'Freelancer not found');
    }

    const existingReview = await prisma.review.findFirst({
      where: {
        clientID: client.id,
        freelancerID: payload.freelancerID,
      },
    });

    if (existingReview) {
      throw new AppError(httpStatus.CONFLICT, 'You have already reviewed this freelancer');
    }

    const completedContract = await prisma.contract.findFirst({
      where: {
        clientID: client.id,
        freelancerID: payload.freelancerID,
        payment: { status: 'RELEASED' }, // or add ContractStatus.COMPLETED
      },
    });
    if (!completedContract) {
      throw new AppError(403, 'You can only review after completing a contract together');
    }

    const review = await prisma.review.create({
      data: {
        clientID: client.id,
        freelancerID: payload.freelancerID,
        rating: payload.rating,
        comment: payload.comment,
      },
    });

    await notificationUtils.createNotification({
      userId: freelancer.user.id,
      title: 'New review received',
      message: 'A client left you a review.',
    });

    return review;
  }

  const freelancer = await prisma.freelancer.findFirst({
    where: { userID: user.userId },
  });

  if (!freelancer || !payload.clientID) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Client review target is required');
  }

  const client = await prisma.client.findUnique({
    where: { id: payload.clientID },
    include: { user: true },
  });

  if (!client) {
    throw new AppError(httpStatus.NOT_FOUND, 'Client not found');
  }

  const existingReview = await prisma.review.findFirst({
    where: {
      clientID: payload.clientID,
      freelancerID: freelancer.id,
    },
  });

  if (existingReview) {
    throw new AppError(httpStatus.CONFLICT, 'You have already reviewed this client');
  }

  const completedContract = await prisma.contract.findFirst({
    where: {
      clientID: client.id,
      freelancerID: payload.freelancerID,
      payment: { status: 'RELEASED' }, // or add ContractStatus.COMPLETED
    },
  });
  if (!completedContract) {
    throw new AppError(403, 'You can only review after completing a contract together');
  }

  const review = await prisma.review.create({
    data: {
      clientID: payload.clientID,
      freelancerID: freelancer.id,
      rating: payload.rating,
      comment: payload.comment,
    },
  });

  await notificationUtils.createNotification({
    userId: client.user.id,
    title: 'New review received',
    message: 'A freelancer left you a review.',
  });

  return review;
};

export const reviewService = {
  createReview,
};

import AppError from '@/app/errorHelpers/AppError';
import { IRequestUser } from '@/app/interfaces/requestUser.interface';
import { prisma } from '@/app/lib/prisma';
import { notificationUtils } from '@/app/utils/notification';
import { UserRole } from '@/generated/prisma/enums';
import httpStatus from 'http-status';

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

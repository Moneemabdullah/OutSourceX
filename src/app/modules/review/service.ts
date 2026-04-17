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

    const review = await prisma.review.create({
      data: {
        clientID: client.id,
        freelancerID: payload.freelancerID,
        rating: payload.rating,
        comment: payload.comment,
      },
    });

    const freelancer = await prisma.freelancer.findUnique({
      where: { id: payload.freelancerID },
      include: { user: true },
    });

    if (freelancer) {
      await notificationUtils.createNotification({
        userId: freelancer.user.id,
        title: 'New review received',
        message: 'A client left you a review.',
      });
    }

    return review;
  }

  const freelancer = await prisma.freelancer.findFirst({
    where: { userID: user.userId },
  });

  if (!freelancer || !payload.clientID) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Client review target is required');
  }

  const review = await prisma.review.create({
    data: {
      clientID: payload.clientID,
      freelancerID: freelancer.id,
      rating: payload.rating,
      comment: payload.comment,
    },
  });

  const client = await prisma.client.findUnique({
    where: { id: payload.clientID },
    include: { user: true },
  });

  if (client) {
    await notificationUtils.createNotification({
      userId: client.user.id,
      title: 'New review received',
      message: 'A freelancer left you a review.',
    });
  }

  return review;
};

export const reviewService = {
  createReview,
};

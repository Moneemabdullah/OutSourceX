import AppError from '@/app/errorHelpers/AppError';
import { IRequestUser } from '@/app/interfaces/requestUser.interface';
import { prisma } from '@/app/lib/prisma';
import httpStatus from 'http-status';

const getMyNotifications = async (user: IRequestUser) => {
  return prisma.notification.findMany({
    where: {
      userID: user.userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

const markAsRead = async (user: IRequestUser, notificationId: string) => {
  const result = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userID: user.userId,
    },
    data: {
      isRead: true,
    },
  });

  if (result.count === 0) {
    throw new AppError(httpStatus.NOT_FOUND, 'Notification not found');
  }

  return prisma.notification.findUnique({
    where: {
      id: notificationId,
    },
  });
};

export const notificationService = {
  getMyNotifications,
  markAsRead,
};

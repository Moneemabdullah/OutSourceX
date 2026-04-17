import { IRequestUser } from '@/app/interfaces/requestUser.interface';
import { prisma } from '@/app/lib/prisma';

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
  await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userID: user.userId,
    },
    data: {
      isRead: true,
    },
  });

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

import { prisma } from '../lib/prisma';

interface INotificationPayload {
  userId: string;
  title: string;
  message: string;
}

const createNotification = async ({ userId, title, message }: INotificationPayload) => {
  return prisma.notification.create({
    data: {
      userID: userId,
      title,
      message,
    },
  });
};

export const notificationUtils = {
  createNotification,
};

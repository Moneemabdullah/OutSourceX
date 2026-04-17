import z from 'zod';

const markAsRead = z.object({
  params: z.object({
    notificationId: z.string(),
  }),
});

export const notificationValidation = {
  markAsRead,
};

import { CheckAuth } from '@/app/middlewares';
import { UserRole } from '@/generated/prisma/enums';
import { Router } from 'express';
import { notificationController } from './controller';

const router = Router();

router.get(
  '/',
  CheckAuth(UserRole.CLIENT, UserRole.FREELANCER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  notificationController.getMyNotifications
);
router.patch(
  '/:notificationId/read',
  CheckAuth(UserRole.CLIENT, UserRole.FREELANCER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  notificationController.markAsRead
);

export const notificationRoute = router;

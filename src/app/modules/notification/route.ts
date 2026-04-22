import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { CheckAuth } from '../../middlewares';
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

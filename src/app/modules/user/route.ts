import { CheckAuth, validateRequest } from '@/app/middlewares';
import { UserRole } from '@/generated/prisma/enums';
import { Router } from 'express';
import { userController } from './controller';
import { userValidation } from './validation';

const router = Router();

router.get(
  '/me',
  CheckAuth(UserRole.CLIENT, UserRole.FREELANCER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  userController.getMyAccount
);
router.patch(
  '/me',
  CheckAuth(UserRole.CLIENT, UserRole.FREELANCER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(userValidation.updateMyAccount),
  userController.updateMyAccount
);

export const userRoute = router;

import { Router } from 'express';
import { userController } from './controller';
import { userValidation } from './validation';
import { CheckAuth, validateRequest } from '../../middlewares';
import { UserRole } from '../../../generated/prisma/enums';

const router = Router();

router.get('/', CheckAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), userController.getAllUsers);
router.get(
  '/dashboard',
  CheckAuth(UserRole.CLIENT, UserRole.FREELANCER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  userController.getDashboard
);
router.get(
  '/transactions',
  CheckAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  userController.getTransactions
);
router.get('/disputes', CheckAuth(UserRole.SUPER_ADMIN), userController.getDisputes);
router.post(
  '/admins/promote',
  CheckAuth(UserRole.SUPER_ADMIN),
  validateRequest(userValidation.promoteAdmin),
  userController.promoteAdmin
);
router.patch(
  '/admins/:userId/demote',
  CheckAuth(UserRole.SUPER_ADMIN),
  validateRequest(userValidation.demoteAdmin),
  userController.demoteAdmin
);
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

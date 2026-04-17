import { CheckAuth, validateRequest } from '@/app/middlewares';
import { UserRole } from '@/generated/prisma/enums';
import { Router } from 'express';
import { authController } from './auth.controller';
import { authValidation } from './validation';

const router = Router();

router.post('/register', validateRequest(authValidation.registerUser), authController.registerUser);
router.post('/login', validateRequest(authValidation.loginUser), authController.loginUser);
router.get('/google', authController.getGoogleOAuthUrl);
router.post(
  '/change-password',
  CheckAuth(UserRole.CLIENT, UserRole.FREELANCER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(authValidation.changePassword),
  authController.changePassword
);
router.post(
  '/forgot-password',
  validateRequest(authValidation.forgotPassword),
  authController.forgotPassword
);
router.post(
  '/reset-password',
  validateRequest(authValidation.resetPassword),
  authController.resetPassword
);
router.get(
  '/me',
  CheckAuth(UserRole.CLIENT, UserRole.FREELANCER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  authController.getMe
);

export const authRoute = router;

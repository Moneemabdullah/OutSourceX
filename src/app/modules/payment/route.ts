import { Router } from 'express';
import { UserRole } from '../../../generated/prisma/enums';
import { CheckAuth, validateRequest } from '../../middlewares';
import { paymentController } from './controller';
import { paymentValidation } from './validation';

const router = Router();

router.get(
  '/',
  CheckAuth(UserRole.CLIENT, UserRole.FREELANCER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  paymentController.getPayments
);
router.post(
  '/',
  CheckAuth(UserRole.CLIENT),
  validateRequest(paymentValidation.createEscrowPayment),
  paymentController.createEscrowPayment
);
router.patch(
  '/:paymentId/release',
  CheckAuth(UserRole.CLIENT),
  validateRequest(paymentValidation.releasePayment),
  paymentController.releasePayment
);

export const paymentRoute = router;

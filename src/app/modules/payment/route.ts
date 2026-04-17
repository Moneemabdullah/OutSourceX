import { Router } from 'express';
import { paymentController } from './controller';
import { paymentValidation } from './validation';
import { CheckAuth, validateRequest } from '../../middlewares';
import { UserRole } from '../../../generated/prisma/enums';

const router = Router();

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

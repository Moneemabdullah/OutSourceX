import { Router } from 'express';
import { reviewController } from './controller';
import { reviewValidation } from './validation';
import { CheckAuth, validateRequest } from '../../middlewares';
import { UserRole } from '../../../generated/prisma/enums';

const router = Router();

router.post(
  '/',
  CheckAuth(UserRole.CLIENT, UserRole.FREELANCER),
  validateRequest(reviewValidation.createReview),
  reviewController.createReview
);

export const reviewRoute = router;

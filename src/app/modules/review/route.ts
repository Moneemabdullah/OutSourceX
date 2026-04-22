import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { CheckAuth, validateRequest } from '../../middlewares';
import { reviewController } from './controller';
import { reviewValidation } from './validation';

const router = Router();

router.post(
  '/',
  CheckAuth(UserRole.CLIENT, UserRole.FREELANCER),
  validateRequest(reviewValidation.createReview),
  reviewController.createReview
);

export const reviewRoute = router;

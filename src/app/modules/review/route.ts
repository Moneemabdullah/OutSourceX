import { CheckAuth, validateRequest } from '@/app/middlewares';
import { UserRole } from '@/generated/prisma/enums';
import { Router } from 'express';
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

import { CheckAuth, validateRequest } from '@/app/middlewares';
import { UserRole } from '@/generated/prisma/enums';
import { Router } from 'express';
import { profileController } from './controller';
import { profileValidation } from './validation';

const router = Router();

router.get('/me', CheckAuth(UserRole.CLIENT, UserRole.FREELANCER), profileController.getMyProfile);
router.post(
  '/',
  CheckAuth(UserRole.CLIENT, UserRole.FREELANCER),
  validateRequest(profileValidation.upsertProfile),
  profileController.upsertMyProfile
);
router.patch(
  '/',
  CheckAuth(UserRole.CLIENT, UserRole.FREELANCER),
  validateRequest(profileValidation.upsertProfile),
  profileController.upsertMyProfile
);

export const profileRoute = router;

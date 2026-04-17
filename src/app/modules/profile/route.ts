import { Router } from 'express';
import { profileController } from './controller';
import { profileValidation } from './validation';
import { CheckAuth, validateRequest } from '../../middlewares';
import { UserRole } from '../../../generated/prisma/enums';

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

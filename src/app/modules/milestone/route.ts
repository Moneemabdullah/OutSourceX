import { CheckAuth, validateRequest } from '@/app/middlewares';
import { UserRole } from '@/generated/prisma/enums';
import { Router } from 'express';
import { milestoneController } from './controller';
import { milestoneValidation } from './validation';

const router = Router();

router.get(
  '/contract/:contractId',
  CheckAuth(UserRole.CLIENT, UserRole.FREELANCER),
  milestoneController.getContractMilestones
);
router.post(
  '/',
  CheckAuth(UserRole.CLIENT),
  validateRequest(milestoneValidation.createMilestone),
  milestoneController.createMilestone
);
router.patch(
  '/:milestoneId/status',
  CheckAuth(UserRole.CLIENT, UserRole.FREELANCER),
  validateRequest(milestoneValidation.updateMilestoneStatus),
  milestoneController.updateMilestoneStatus
);

export const milestoneRoute = router;

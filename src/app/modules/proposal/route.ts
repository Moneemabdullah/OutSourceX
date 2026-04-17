import { CheckAuth, validateRequest } from '@/app/middlewares';
import { UserRole } from '@/generated/prisma/enums';
import { Router } from 'express';
import { proposalController } from './controller';
import { proposalValidation } from './validation';

const router = Router();

router.get(
  '/',
  CheckAuth(UserRole.CLIENT, UserRole.FREELANCER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  proposalController.getProposals
);
router.post(
  '/',
  CheckAuth(UserRole.FREELANCER),
  validateRequest(proposalValidation.applyToJob),
  proposalController.applyToJob
);
router.patch('/:proposalId/accept', CheckAuth(UserRole.CLIENT), proposalController.acceptProposal);
router.get(
  '/job/:jobId',
  CheckAuth(UserRole.CLIENT, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  proposalController.getJobProposals
);

export const proposalRoute = router;

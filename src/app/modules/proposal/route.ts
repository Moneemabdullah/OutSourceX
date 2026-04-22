import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { CheckAuth, validateRequest } from '../../middlewares';
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
router.patch('/:proposalId/reject', CheckAuth(UserRole.CLIENT), proposalController.rejectProposal);
router.get(
  '/job/:jobId',
  CheckAuth(UserRole.CLIENT, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  proposalController.getJobProposals
);

export const proposalRoute = router;

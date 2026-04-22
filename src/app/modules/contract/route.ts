import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { CheckAuth, validateRequest } from '../../middlewares';
import { contractController } from './controller';
import { contractValidation } from './validation';

const router = Router();

router.get('/', CheckAuth(UserRole.CLIENT, UserRole.FREELANCER), contractController.getContracts);
router.post(
  '/',
  CheckAuth(UserRole.CLIENT),
  validateRequest(contractValidation.createContract),
  contractController.createContractFromProposal
);

export const contractRoute = router;

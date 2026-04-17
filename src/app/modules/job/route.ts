import { Router } from 'express';
import { jobController } from './controller';
import { jobValidation } from './validation';
import { CheckAuth, validateRequest } from '../../middlewares';
import { UserRole } from '../../../generated/prisma/enums';

const router = Router();

router.get('/', jobController.getJobs);
router.post(
  '/',
  CheckAuth(UserRole.CLIENT),
  validateRequest(jobValidation.createJob),
  jobController.createJob
);
router.patch(
  '/:jobId',
  CheckAuth(UserRole.CLIENT),
  validateRequest(jobValidation.updateJob),
  jobController.updateJob
);
router.delete('/:jobId', CheckAuth(UserRole.CLIENT), jobController.deleteJob);

export const jobRoute = router;

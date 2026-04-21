import { Router } from 'express';
import { UserRole } from '../../../generated/prisma/enums';
import { CheckAuth, validateRequest } from '../../middlewares';
import { jobController } from './controller';
import { jobValidation } from './validation';

const router = Router();

router.get('/', jobController.getJobs);
router.get('/:jobId', jobController.getJob);
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

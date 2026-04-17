import { Router } from 'express';
import { authRoute } from '../modules/auth/route';
import { categoryRoute } from '../modules/category/route';
import { contractRoute } from '../modules/contract/route';
import { jobRoute } from '../modules/job/route';
import { milestoneRoute } from '../modules/milestone/route';
import { notificationRoute } from '../modules/notification/route';
import { paymentRoute } from '../modules/payment/route';
import { profileRoute } from '../modules/profile/route';
import { proposalRoute } from '../modules/proposal/route';
import { reviewRoute } from '../modules/review/route';
import { userRoute } from '../modules/user/route';

const router = Router();

router.use('/auth', authRoute);
router.use('/users', userRoute);
router.use('/profiles', profileRoute);
router.use('/categories', categoryRoute);
router.use('/jobs', jobRoute);
router.use('/proposals', proposalRoute);
router.use('/contracts', contractRoute);
router.use('/milestones', milestoneRoute);
router.use('/payments', paymentRoute);
router.use('/reviews', reviewRoute);
router.use('/notifications', notificationRoute);

export const indexRoute = router;

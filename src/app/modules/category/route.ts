import { UserRole } from '@prisma/client';
import { Router } from 'express';
import { CheckAuth, validateRequest } from '../../middlewares';
import { categoryController } from './controller';
import { categoryValidation } from './validation';

const router = Router();

router.get('/', categoryController.getCategories);
router.post(
  '/',
  CheckAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(categoryValidation.createCategory),
  categoryController.createCategory
);
router.patch(
  '/:categoryId',
  CheckAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(categoryValidation.updateCategory),
  categoryController.updateCategory
);
router.delete(
  '/:categoryId',
  CheckAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  categoryController.deleteCategory
);

export const categoryRoute = router;

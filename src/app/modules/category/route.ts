import { CheckAuth, validateRequest } from '@/app/middlewares';
import { UserRole } from '@/generated/prisma/enums';
import { Router } from 'express';
import { categoryController } from './controller';
import { categoryValidation } from './validation';

const router = Router();

router.get('/', categoryController.getCategories);
router.post(
  '/',
  CheckAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(categoryValidation.upsertCategory),
  categoryController.createCategory
);
router.patch(
  '/:categoryId',
  CheckAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(categoryValidation.upsertCategory),
  categoryController.updateCategory
);
router.delete(
  '/:categoryId',
  CheckAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  categoryController.deleteCategory
);

export const categoryRoute = router;

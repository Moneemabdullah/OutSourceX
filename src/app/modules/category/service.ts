import AppError from '@/app/errorHelpers/AppError';
import { prisma } from '@/app/lib/prisma';
import httpStatus from 'http-status';

const createCategory = async (payload: { title: string; description?: string }) => {
  const existingCategory = await prisma.jobCategory.findFirst({
    where: {
      title: payload.title,
    },
  });

  if (existingCategory) {
    throw new AppError(httpStatus.CONFLICT, 'Category already exists');
  }

  return prisma.jobCategory.create({
    data: payload,
  });
};

const getCategories = async () => {
  return prisma.jobCategory.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
};

const updateCategory = async (
  categoryId: string,
  payload: { title?: string; description?: string }
) => {
  const existingCategory = await prisma.jobCategory.findUnique({
    where: { id: categoryId },
  });

  if (!existingCategory) {
    throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
  }

  if (payload.title && payload.title !== existingCategory.title) {
    const duplicateCategory = await prisma.jobCategory.findFirst({
      where: {
        title: payload.title,
      },
    });

    if (duplicateCategory) {
      throw new AppError(httpStatus.CONFLICT, 'Category already exists');
    }
  }

  return prisma.jobCategory.update({
    where: { id: categoryId },
    data: payload,
  });
};

const deleteCategory = async (categoryId: string) => {
  const existingCategory = await prisma.jobCategory.findUnique({
    where: { id: categoryId },
    include: {
      jobs: true,
    },
  });

  if (!existingCategory) {
    throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
  }

  if (existingCategory.jobs.length > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Category cannot be deleted while jobs still use it'
    );
  }

  return prisma.jobCategory.delete({
    where: { id: categoryId },
  });
};

export const categoryService = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
};

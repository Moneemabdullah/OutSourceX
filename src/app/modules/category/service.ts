import { prisma } from '@/app/lib/prisma';

const createCategory = async (payload: { title: string; description?: string }) => {
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
  return prisma.jobCategory.update({
    where: { id: categoryId },
    data: payload,
  });
};

const deleteCategory = async (categoryId: string) => {
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

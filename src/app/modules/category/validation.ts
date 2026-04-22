import z from 'zod';

const createCategory = z.object({
  body: z.object({
    title: z.string().min(2, "Title must be at least 2 characters"),
    description: z.string().optional(),
  }),
});

const updateCategory = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
  }),
});

export const categoryValidation = {
  createCategory,
  updateCategory,
};

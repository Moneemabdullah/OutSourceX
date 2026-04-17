import z from 'zod';

const upsertCategory = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
  }),
});

export const categoryValidation = {
  upsertCategory,
};

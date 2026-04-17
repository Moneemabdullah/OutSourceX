import z from 'zod';

const updateMyAccount = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    image: z.string().url().optional(),
    contactNumber: z.string().min(5).optional(),
  }),
});

export const userValidation = {
  updateMyAccount,
};

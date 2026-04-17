import z from 'zod';

const createReview = z.object({
  body: z.object({
    clientID: z.string().optional(),
    freelancerID: z.string().optional(),
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
  }),
});

export const reviewValidation = {
  createReview,
};

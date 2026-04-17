import z from 'zod';

const createContract = z.object({
  body: z.object({
    proposalID: z.string(),
    title: z.string().min(3),
    description: z.string().optional(),
  }),
});

export const contractValidation = {
  createContract,
};

import z from 'zod';

const applyToJob = z.object({
  body: z.object({
    jobID: z.string(),
    coverLetter: z.string().min(10),
    bidAmount: z.number().positive(),
  }),
});

export const proposalValidation = {
  applyToJob,
};

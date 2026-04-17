import z from 'zod';

const createJob = z.object({
  body: z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    budget: z.number().nonnegative().optional(),
    deadline: z.string().datetime().optional(),
    categoryID: z.string(),
  }),
});

const updateJob = z.object({
  body: createJob.shape.body.partial(),
});

export const jobValidation = {
  createJob,
  updateJob,
};

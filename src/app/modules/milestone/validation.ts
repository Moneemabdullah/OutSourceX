import z from 'zod';

const createMilestone = z.object({
  body: z.object({
    contractID: z.string(),
    title: z.string().min(3),
    description: z.string().optional(),
    amount: z.number().positive(),
    dueDate: z.string().datetime().optional(),
  }),
});

const updateMilestoneStatus = z.object({
  body: z.object({
    milestoneStatus: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED']),
  }),
});

export const milestoneValidation = {
  createMilestone,
  updateMilestoneStatus,
};

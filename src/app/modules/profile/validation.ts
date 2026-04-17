import z from 'zod';

const upsertProfile = z.object({
  body: z.object({
    bio: z.string().optional(),
    cv: z.string().url().optional(),
    hourlyRate: z.number().nonnegative().optional(),
    expertiseId: z.string().optional(),
    expertiseTitle: z.string().min(2).optional(),
  }),
});

export const profileValidation = {
  upsertProfile,
};

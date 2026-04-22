import { UserRole } from '@prisma/client';
import z from 'zod';

const updateMyAccount = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    image: z.string().url().optional(),
    contactNumber: z.string().min(5).optional(),
  }),
});

const promoteAdmin = z.object({
  body: z.object({
    userId: z.string(),
  }),
});

const createAdmin = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
  }),
});

const demoteAdmin = z.object({
  body: z.object({
    role: z.enum([UserRole.CLIENT, UserRole.FREELANCER]),
  }),
  params: z.object({
    userId: z.string(),
  }),
});

export const userValidation = {
  updateMyAccount,
  promoteAdmin,
  createAdmin,
  demoteAdmin,
};

import { UserRole } from '@/generated/prisma/enums';
import z from 'zod';

const registerUser = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum([UserRole.CLIENT, UserRole.FREELANCER]),
  }),
});

const loginUser = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

export const authValidation = {
  registerUser,
  loginUser,
};

import z from 'zod';
import { UserRole } from '../../../generated/prisma/enums';

const registerUser = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum([UserRole.CLIENT, UserRole.FREELANCER]).optional(),
  }),
});

const loginUser = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

const changePassword = z.object({
  body: z.object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8),
    revokeOtherSessions: z.boolean().optional(),
  }),
});

const forgotPassword = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

const resetPassword = z.object({
  body: z.object({
    email: z.string().email(),
    otp: z.string().min(4),
    password: z.string().min(8),
  }),
});

export const authValidation = {
  registerUser,
  loginUser,
  changePassword,
  forgotPassword,
  resetPassword,
};

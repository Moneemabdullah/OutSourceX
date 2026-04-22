import { UserRole } from '@prisma/client';

export interface IRequestUser {
  userId: string;
  role: UserRole;
  email: string;
}

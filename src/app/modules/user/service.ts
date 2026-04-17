import AppError from '@/app/errorHelpers/AppError';
import { IRequestUser } from '@/app/interfaces/requestUser.interface';
import { prisma } from '@/app/lib/prisma';
import httpStatus from 'http-status';

const getMyAccount = async (user: IRequestUser) => {
  const account = await prisma.user.findUnique({
    where: { id: user.userId },
  });

  if (!account) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  return account;
};

const updateMyAccount = async (
  user: IRequestUser,
  payload: { name?: string; image?: string; contactNumber?: string }
) => {
  const account = await prisma.user.update({
    where: { id: user.userId },
    data: payload,
  });

  return account;
};

export const userService = {
  getMyAccount,
  updateMyAccount,
};

import AppError from '@/app/errorHelpers/AppError';
import { IQueryParams } from '@/app/interfaces/Query.interface';
import { IRequestUser } from '@/app/interfaces/requestUser.interface';
import { prisma } from '@/app/lib/prisma';
import { QueryBuilder } from '@/app/utils/QueryBuilder';
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

const getAllUsers = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder(prisma.user, query, {
    searchableFields: ['name', 'email', 'contactNumber'],
    filterableFields: ['role', 'status', 'emailVerified'],
  });

  return queryBuilder.search().filter().sort().paginate().execute();
};

export const userService = {
  getMyAccount,
  updateMyAccount,
  getAllUsers,
};

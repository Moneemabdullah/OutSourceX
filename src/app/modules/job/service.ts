import AppError from '@/app/errorHelpers/AppError';
import { IQueryParams } from '@/app/interfaces/Query.interface';
import { IRequestUser } from '@/app/interfaces/requestUser.interface';
import { prisma } from '@/app/lib/prisma';
import { QueryBuilder } from '@/app/utils/QueryBuilder';
import httpStatus from 'http-status';

const getClientProfileId = async (userId: string) => {
  const client = await prisma.client.findFirst({
    where: { userID: userId },
  });

  if (!client) {
    throw new AppError(httpStatus.NOT_FOUND, 'Client profile not found');
  }

  return client.id;
};

const createJob = async (
  user: IRequestUser,
  payload: {
    title: string;
    description?: string;
    budget?: number;
    deadline?: string;
    categoryID: string;
  }
) => {
  const clientId = await getClientProfileId(user.userId);

  return prisma.job.create({
    data: {
      title: payload.title,
      description: payload.description,
      budget: payload.budget,
      deadline: payload.deadline ? new Date(payload.deadline) : undefined,
      categoryID: payload.categoryID,
      ownerID: clientId,
    },
  });
};

const updateJob = async (
  user: IRequestUser,
  jobId: string,
  payload: {
    title?: string;
    description?: string;
    budget?: number;
    deadline?: string;
    categoryID?: string;
  }
) => {
  const clientId = await getClientProfileId(user.userId);
  const job = await prisma.job.findUnique({ where: { id: jobId } });

  if (!job || job.ownerID !== clientId) {
    throw new AppError(httpStatus.NOT_FOUND, 'Job not found');
  }

  return prisma.job.update({
    where: { id: jobId },
    data: {
      ...payload,
      deadline: payload.deadline ? new Date(payload.deadline) : undefined,
    },
  });
};

const deleteJob = async (user: IRequestUser, jobId: string) => {
  const clientId = await getClientProfileId(user.userId);
  const job = await prisma.job.findUnique({ where: { id: jobId } });

  if (!job || job.ownerID !== clientId) {
    throw new AppError(httpStatus.NOT_FOUND, 'Job not found');
  }

  return prisma.job.delete({
    where: { id: jobId },
  });
};

const getJobs = async (query: IQueryParams) => {
  const queryBuilder = new QueryBuilder(prisma.job, query, {
    searchableFields: ['title', 'description', 'category.title', 'owner.user.name'],
    filterableFields: ['categoryID', 'ownerID', 'budget', 'deadline'],
  });

  return queryBuilder
    .search()
    .filter()
    .sort()
    .paginate()
    .include({
      category: true,
      owner: {
        include: {
          user: true,
        },
      },
    })
    .execute();
};

export const jobService = {
  createJob,
  updateJob,
  deleteJob,
  getJobs,
};

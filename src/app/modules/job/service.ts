import httpStatus from 'http-status';
import { prisma } from '../../lib/prisma';
import AppError from '../../errorHelpers/AppError';
import { IRequestUser } from '../../interfaces/requestUser.interface';
import { IQueryParams } from '../../interfaces/Query.interface';
import { QueryBuilder } from '../../utils/QueryBuilder';

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
  const category = await prisma.jobCategory.findUnique({
    where: { id: payload.categoryID },
  });

  if (!category) {
    throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
  }

  if (payload.deadline && new Date(payload.deadline) <= new Date()) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Deadline must be in the future');
  }

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
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      contracts: true,
    },
  });

  if (!job || job.ownerID !== clientId) {
    throw new AppError(httpStatus.NOT_FOUND, 'Job not found');
  }

  if (payload.categoryID) {
    const category = await prisma.jobCategory.findUnique({
      where: { id: payload.categoryID },
    });

    if (!category) {
      throw new AppError(httpStatus.NOT_FOUND, 'Category not found');
    }
  }

  if (payload.deadline && new Date(payload.deadline) <= new Date()) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Deadline must be in the future');
  }

  if (job.contracts.length > 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Jobs with contracts cannot be modified');
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
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      contracts: true,
    },
  });

  if (!job || job.ownerID !== clientId) {
    throw new AppError(httpStatus.NOT_FOUND, 'Job not found');
  }

  if (job.contracts.length > 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Jobs with contracts cannot be deleted');
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

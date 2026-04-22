import { UserRole } from '@prisma/client';
import httpStatus from 'http-status';
import AppError from '../../errorHelpers/AppError';
import { IRequestUser } from '../../interfaces/requestUser.interface';
import { prisma } from '../../lib/prisma';

const resolveExpertiseId = async (payload: { expertiseId?: string; expertiseTitle?: string }) => {
  if (payload.expertiseId) {
    const expertise = await prisma.expertise.findUnique({
      where: { id: payload.expertiseId },
    });

    if (!expertise) {
      throw new AppError(httpStatus.NOT_FOUND, 'Expertise not found');
    }

    return payload.expertiseId;
  }

  if (!payload.expertiseTitle) {
    return undefined;
  }

  const expertise = await prisma.expertise.upsert({
    where: { title: payload.expertiseTitle },
    update: {},
    create: {
      title: payload.expertiseTitle,
    },
  });

  return expertise.id;
};

const upsertMyProfile = async (
  user: IRequestUser,
  payload: {
    bio?: string;
    cv?: string;
    hourlyRate?: number;
    expertiseId?: string;
    expertiseTitle?: string;
  }
) => {
  if (user.role === UserRole.CLIENT) {
    const client = await prisma.client.findFirst({
      where: { userID: user.userId },
    });

    if (!client) {
      throw new AppError(httpStatus.NOT_FOUND, 'Client profile not found');
    }

    return prisma.client.update({
      where: { id: client.id },
      data: {
        bio: payload.bio,
      },
    });
  }

  if (user.role === UserRole.FREELANCER) {
    const freelancer = await prisma.freelancer.findFirst({
      where: { userID: user.userId },
    });

    if (!freelancer) {
      throw new AppError(httpStatus.NOT_FOUND, 'Freelancer profile not found');
    }

    const expertiseId = await resolveExpertiseId(payload);

    if (payload.hourlyRate !== undefined && payload.hourlyRate < 0) {
      throw new AppError(httpStatus.BAD_REQUEST, 'Hourly rate cannot be negative');
    }

    return prisma.freelancer.update({
      where: { id: freelancer.id },
      data: {
        bio: payload.bio,
        cv: payload.cv,
        hourlyRate: payload.hourlyRate,
        expertiseID: expertiseId,
      },
      include: {
        expertise: true,
      },
    });
  }

  throw new AppError(httpStatus.FORBIDDEN, 'Only clients and freelancers have profiles');
};

const getMyProfile = async (user: IRequestUser) => {
  if (user.role === UserRole.CLIENT) {
    const client = await prisma.client.findFirst({
      where: { userID: user.userId },
      include: {
        user: true,
      },
    });

    if (!client) {
      throw new AppError(httpStatus.NOT_FOUND, 'Client profile not found');
    }

    return client;
  }

  const freelancer = await prisma.freelancer.findFirst({
    where: { userID: user.userId },
    include: {
      user: true,
      expertise: true,
    },
  });

  if (!freelancer) {
    throw new AppError(httpStatus.NOT_FOUND, 'Freelancer profile not found');
  }

  return freelancer;
};

export const profileService = {
  upsertMyProfile,
  getMyProfile,
};

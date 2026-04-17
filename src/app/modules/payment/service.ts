import httpStatus from 'http-status';
import { randomUUID } from 'node:crypto';
import { IRequestUser } from '../../interfaces/requestUser.interface';
import { prisma } from '../../lib/prisma';
import AppError from '../../errorHelpers/AppError';
import { notificationUtils } from '../../utils/notification';
import { Prisma } from '../../../generated/prisma/client';
import { sendEmail } from '../../utils/emailService';

const createEscrowPayment = async (
  user: IRequestUser,
  payload: { contractID: string; amount: number; paymentGatewayData?: Record<string, unknown> }
) => {
  const contract = await prisma.contract.findUnique({
    where: { id: payload.contractID },
    include: {
      client: {
        include: {
          user: true,
        },
      },
      freelancer: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!contract) {
    throw new AppError(httpStatus.NOT_FOUND, 'Contract not found');
  }

  if (contract.client.user.id !== user.userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'Only the client can fund escrow');
  }

  const existingPayment = await prisma.payment.findUnique({
    where: { contractID: payload.contractID },
  });

  if (existingPayment?.status === 'RELEASED') {
    throw new AppError(httpStatus.BAD_REQUEST, 'Released payments cannot be funded again');
  }

  const milestones = await prisma.milestone.findMany({
    where: {
      jobID: contract.jobID,
    },
  });

  if (milestones.length === 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Create at least one milestone before funding escrow'
    );
  }

  const totalMilestoneAmount = milestones.reduce((sum, milestone) => sum + milestone.amount, 0);

  if (payload.amount < totalMilestoneAmount) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Escrow amount must cover the total amount of all milestones'
    );
  }

  if (existingPayment?.status === 'ESCROW' && existingPayment.amount === payload.amount) {
    throw new AppError(httpStatus.CONFLICT, 'Escrow has already been funded with this amount');
  }

  const payment = await prisma.payment.upsert({
    where: { contractID: payload.contractID },
    update: {
      amount: payload.amount,
      status: 'ESCROW',
      transactionId: randomUUID(),
      paymentGatewayData: payload.paymentGatewayData as Prisma.InputJsonValue | undefined,
    },
    create: {
      contractID: payload.contractID,
      amount: payload.amount,
      status: 'ESCROW',
      transactionId: randomUUID(),
      paymentGatewayData: payload.paymentGatewayData as Prisma.InputJsonValue | undefined,
    },
  });

  await notificationUtils.createNotification({
    userId: contract.freelancer.user.id,
    title: 'Escrow funded',
    message: `Escrow was funded for contract "${contract.title}".`,
  });

  return payment;
};

const releasePayment = async (user: IRequestUser, paymentId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      contract: {
        include: {
          client: {
            include: {
              user: true,
            },
          },
          freelancer: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment not found');
  }

  if (payment.contract.client.user.id !== user.userId) {
    throw new AppError(httpStatus.FORBIDDEN, 'Only the client can release payment');
  }

  if (payment.status === 'RELEASED') {
    throw new AppError(httpStatus.BAD_REQUEST, 'Payment has already been released');
  }

  if (payment.status !== 'ESCROW') {
    throw new AppError(httpStatus.BAD_REQUEST, 'Only escrow payments can be released');
  }

  const milestones = await prisma.milestone.findMany({
    where: {
      jobID: payment.contract.jobID,
    },
  });

  if (milestones.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'No milestones found for this contract');
  }

  const hasIncompleteMilestone = milestones.some(
    (milestone) => milestone.milestoneStatus !== 'COMPLETED'
  );

  if (hasIncompleteMilestone) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'All milestones must be completed before releasing payment'
    );
  }

  const releasedPayment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: 'RELEASED',
    },
  });

  await notificationUtils.createNotification({
    userId: payment.contract.freelancer.user.id,
    title: 'Payment released',
    message: `Payment for contract "${payment.contract.title}" was released.`,
  });

  await sendEmail({
    to: payment.contract.freelancer.user.email,
    subject: 'Payment released',
    template: 'paymentReleased',
    templateData: {
      name: payment.contract.freelancer.user.name,
      contractTitle: payment.contract.title,
      amount: payment.amount,
    },
  });

  return releasedPayment;
};

export const paymentService = {
  createEscrowPayment,
  releasePayment,
};

import AppError from '@/app/errorHelpers/AppError';
import { IRequestUser } from '@/app/interfaces/requestUser.interface';
import { prisma } from '@/app/lib/prisma';
import { sendEmail } from '@/app/utils/emailService';
import { notificationUtils } from '@/app/utils/notification';
import { Prisma } from '@/generated/prisma/client';
import httpStatus from 'http-status';
import { randomUUID } from 'node:crypto';

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

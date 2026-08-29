import { Prisma, UserRole } from '@prisma/client';
import httpStatus from 'http-status';
import { randomUUID } from 'node:crypto';
import AppError from '../../errorHelpers/AppError';
import { IQueryParams } from '../../interfaces/Query.interface';
import { IRequestUser } from '../../interfaces/requestUser.interface';
import { prisma } from '../../lib/prisma';
import { sendEmail } from '../../utils/emailService';
import { notificationUtils } from '../../utils/notification';
import { QueryBuilder } from '../../utils/QueryBuilder';
import Stripe from 'stripe';
import logger from '../../lib/logger';

interface IEscrowPaymentData {
  status: 'ESCROW';
  transactionId: string;
  paymentGatewayData: Prisma.InputJsonValue;
}

interface IEscrowNotification {
  userId: string;
  title: 'Escrow funded';
  message: string;
}

const handleStripeWebhookEvent = async (event: Stripe.Event) => {
  const existingPayment = await prisma.payment.findFirst({
    where: { transactionId: event.id as string },
  });
  if (existingPayment) {
    logger.error(`Payment with transactionId ${event.id} already exists. Skipping processing.`);
    return;
  }

  switch (event.type) {
    case 'checkout.session.completed':
      // Handle checkout session completed event
      {
        const session = event.data.object as Stripe.Checkout.Session;

        const contractID = session.metadata?.contractID;
        const paymentID = session.metadata?.paymentID;

        if (!contractID || !paymentID) {
          logger.error('Missing contractID or paymentID in session metadata');
          return;
        }

        const contract = await prisma.contract.findUnique({
          where: { id: contractID },
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
          logger.error(`Contract with ID ${contractID} not found`);
          return;
        }
        
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: paymentID },
            data: {
              status: 'ESCROW',
              transactionId: session.payment_intent as string,
              paymentGatewayData: session as Prisma.InputJsonValue,
            },
          });

          await notificationUtils.createNotification({
            userId: contract.freelancer.user.id,
            title: 'Escrow funded',
            message: `Escrow was funded for contract "${contract.title}".`,
          });
        });


      }
      break;
    case 'payment_intent.succeeded':
      // Handle payment intent succeeded event
      {}
      break;
    case 'checkout.session.expired':
      // Handle checkout session expired event
      {}  
      break;
    case 'payment_intent.payment_failed':
      // Handle payment intent failed event
      {}
      break;
    default:
      logger.warn(`Unhandled Stripe event type: ${event.type}`);
  }
};

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

const getPayments = async (user: IRequestUser, query: IQueryParams) => {
  const queryBuilder = new QueryBuilder(prisma.payment, query, {
    searchableFields: ['transactionId', 'contract.title', 'contract.job.title'],
    filterableFields: ['status', 'contractID', 'amount'],
  });

  if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
    return queryBuilder
      .search()
      .filter()
      .sort()
      .paginate()
      .include({
        contract: {
          include: {
            job: true,
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
      })
      .execute();
  }

  return queryBuilder
    .where({
      OR: [
        {
          contract: {
            client: {
              userID: user.userId,
            },
          },
        },
        {
          contract: {
            freelancer: {
              userID: user.userId,
            },
          },
        },
      ],
    })
    .search()
    .filter()
    .sort()
    .paginate()
    .include({
      contract: {
        include: {
          job: true,
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
    })
    .execute();
};

export const paymentService = {
  getPayments,
  createEscrowPayment,
  releasePayment,
};

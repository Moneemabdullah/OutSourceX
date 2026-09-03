import { Prisma, UserRole } from '@prisma/client';
import Stripe from 'stripe';
import httpStatus from 'http-status';
import AppError from '../../errorHelpers/AppError';
import { IQueryParams } from '../../interfaces/Query.interface';
import { IRequestUser } from '../../interfaces/requestUser.interface';
import { prisma } from '../../lib/prisma';
import { sendEmail } from '../../utils/emailService';
import { notificationUtils } from '../../utils/notification';
import { QueryBuilder } from '../../utils/QueryBuilder';
import { envVars } from '../../config/env.utils';

export const stripe = new Stripe(envVars.STRIPE_.SECRET_KEY);

// Stripe webhook handling now lives in ./payment.webhook.ts — wire your
// webhook route to `handleStripeWebhookEvent` from that file directly rather
// than through this service.

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

  // Create Stripe PaymentIntent
  const stripePaymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(payload.amount * 100), // Convert to cents
    currency: 'usd',
    metadata: {
      contractID: payload.contractID,
      paymentID: payload.contractID, // Use contractID as payment identifier
    },
    automatic_payment_methods: {
      enabled: true,
    },
  });

  const payment = await prisma.payment.upsert({
    where: { contractID: payload.contractID },
    update: {
      amount: payload.amount,
      status: 'PENDING',
      stripePaymentIntentId: stripePaymentIntent.id,
      transactionId: stripePaymentIntent.id,
      paymentGatewayData: {
        ...payload.paymentGatewayData,
        stripePaymentIntentId: stripePaymentIntent.id,
        amount: payload.amount,
        currency: 'usd',
      } as Prisma.InputJsonValue,
    },
    create: {
      contractID: payload.contractID,
      amount: payload.amount,
      status: 'PENDING',
      stripePaymentIntentId: stripePaymentIntent.id,
      transactionId: stripePaymentIntent.id,
      paymentGatewayData: {
        stripePaymentIntentId: stripePaymentIntent.id,
        amount: payload.amount,
        currency: 'usd',
        ...payload.paymentGatewayData,
      } as Prisma.InputJsonValue,
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

const getPaymentById = async (user: IRequestUser, paymentId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
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
    },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Payment not found');
  }

  // Check authorization: user must be associated with the payment's contract
  const isClient = payment.contract.client.user.id === user.userId;
  const isFreelancer = payment.contract.freelancer.user.id === user.userId;

  if (!isClient && !isFreelancer) {
    throw new AppError(httpStatus.FORBIDDEN, 'You do not have access to this payment');
  }

  return payment;
};

export const paymentService = {
  getPaymentById,
  getPayments,
  createEscrowPayment,
  releasePayment,
};
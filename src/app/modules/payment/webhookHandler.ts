import Stripe from 'stripe';
import { prisma } from '../../lib/prisma';
import { notificationUtils } from '../../utils/notification';
import { sendEmail } from '../../utils/emailService';
import logger from '../../lib/logger';

const handleStripeWebhookEventInternal = async (event: Stripe.Event) => {
  const existingPayment = await prisma.payment.findFirst({
    where: { stripeEventId: event.id },
  });

  if (existingPayment) {
    logger.warn(`Stripe event ${event.id} already processed. Skipping.`);
    return;
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const paymentID = paymentIntent.metadata?.paymentID;

      if (!paymentID) {
        logger.error('Missing paymentID in payment_intent.succeeded metadata');
        return;
      }

      const payment = await prisma.payment.findUnique({
        where: { id: paymentID },
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
        logger.error(`Payment ${paymentID} not found for succeeded payment intent`);
        return;
      }

      await prisma.payment.update({
        where: { id: paymentID },
        data: {
          status: 'ESCROW',
          stripeEventId: event.id,
        },
      });

      await notificationUtils.createNotification({
        userId: payment.contract.freelancer.user.id,
        title: 'Escrow funded',
        message: `Payment for contract "${payment.contract.title}" was successful.`,
      });

      logger.info(`Payment ${paymentID} succeeded and moved to ESCROW`);
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const paymentID = paymentIntent.metadata?.paymentID;

      if (!paymentID) {
        logger.error('Missing paymentID in payment_intent.payment_failed metadata');
        return;
      }

      const payment = await prisma.payment.findUnique({
        where: { id: paymentID },
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
        logger.error(`Payment ${paymentID} not found for failed payment intent`);
        return;
      }

      await prisma.payment.update({
        where: { id: paymentID },
        data: {
          status: 'FAILED',
          stripeEventId: event.id,
        },
      });

      await notificationUtils.createNotification({
        userId: payment.contract.client.user.id,
        title: 'Payment failed',
        message: `Escrow funding failed for contract "${payment.contract.title}". Please try again.`,
      });

      await sendEmail({
        to: payment.contract.client.user.email,
        subject: 'Payment failed',
        template: 'paymentFailed',
        templateData: {
          name: payment.contract.client.user.name,
          contractTitle: payment.contract.title,
          reason: paymentIntent.last_payment_error?.message ?? 'Unknown error',
        },
      });

      logger.info(`Payment ${paymentID} failed`);
      break;
    }

    case 'payment_intent.canceled': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const paymentID = paymentIntent.metadata?.paymentID;

      if (!paymentID) {
        logger.error('Missing paymentID in payment_intent.canceled metadata');
        return;
      }

      const payment = await prisma.payment.findUnique({
        where: { id: paymentID },
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
        logger.error(`Payment ${paymentID} not found for canceled payment intent`);
        return;
      }

      await prisma.payment.update({
        where: { id: paymentID },
        data: {
          status: 'CANCELED',
          stripeEventId: event.id,
        },
      });

      logger.info(`Payment ${paymentID} canceled`);
      break;
    }

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const contractID = session.metadata?.contractID;
      const paymentID = session.metadata?.paymentID;

      if (!contractID || !paymentID) {
        logger.error('Missing contractID or paymentID in checkout.session.completed metadata');
        return;
      }

      const contract = await prisma.contract.findUnique({
        where: { id: contractID },
        include: {
          freelancer: { include: { user: true } },
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
            stripeEventId: event.id,
            transactionId: session.payment_intent as string,
          },
        });

        await notificationUtils.createNotification({
          userId: contract.freelancer.user.id,
          title: 'Escrow funded',
          message: `Escrow was funded for contract "${contract.title}".`,
        });
      });

      logger.info(`Checkout session ${session.id} completed for payment ${paymentID}`);
      break;
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentID = session.metadata?.paymentID;

      if (!paymentID) {
        logger.error('Missing paymentID in checkout.session.expired metadata');
        return;
      }

      const payment = await prisma.payment.findUnique({ where: { id: paymentID } });

      if (!payment || payment.status !== 'PENDING') {
        return;
      }

      await prisma.payment.update({
        where: { id: paymentID },
        data: {
          status: 'FAILED',
          stripeEventId: event.id,
        },
      });

      logger.warn(`Checkout session expired for payment ${paymentID}`);
      break;
    }

    default:
      logger.warn(`Unhandled Stripe event type: ${event.type}`);
  }
};

export const handleStripeWebhookEvent = async (event: Stripe.Event) => {
  await handleStripeWebhookEventInternal(event);
};
import express, { Application, Request, Response } from 'express';
import notFoundMiddleware from './app/middlewares/notFound';
import cookieParser from 'cookie-parser';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './app/lib/auth';
import path from 'node:path';
import cors from 'cors';
import { envVars } from './app/config/env.utils';
import { indexRoute } from './app/routes';
import { logger } from './app/lib/logger';
import { requestLogger } from './app/middlewares/requestLogger';
import { globalErrorHandler } from './app/middlewares';
import { stripe } from './app/modules/payment/service';
import { handleStripeWebhookEvent } from './app/modules/payment/webhookHandler';
import type { Stripe } from 'stripe';

const app: Application = express();

app.set('view engine', 'ejs');
app.set('views', path.resolve(process.cwd(), 'src/app/templates/'));


app.post("/webhook", express.raw({type: "application/json"}), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, envVars.STRIPE_.WEBHOOK_SECRET);
  } catch (err: any) {
    logger.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await handleStripeWebhookEvent(event);
    res.status(200).send('Webhook processed');
  } catch (error: any) {
    logger.error(`Error processing webhook event: ${error.message}`);
    res.status(500).send(`Webhook Error: ${error.message}`);
  }
});

app.use(
  cors({
    origin: [envVars.FRONTEND_URL as string, envVars.BETTER_AUTH_URL as string],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

logger.info(
  'CORS configured with allowed origins: ' +
    [envVars.FRONTEND_URL, envVars.BETTER_AUTH_URL].join(', ')
);

logger.info('Express app initialized');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

app.use('/api/auth', toNodeHandler(auth));

app.use('/api/v1', indexRoute);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, World!');
});

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(globalErrorHandler);
app.use(notFoundMiddleware);

export default app;

import express, { Application, Request, Response } from 'express';
import { SpecialtyRoute } from './app/module/specialty/specialty.route';
import { IndexRoute } from './app/routes';
import { any } from 'better-auth';
import { globalErrorHandler } from './app/middleware/GlobalErrorHandeler';
import notFoundMiddleware from './app/middleware/notFound';
import cookieParser from 'cookie-parser';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './app/lib/auth';
import path from 'node:path';
import cors from 'cors';
import { envVars } from './app/config/env';
import { env } from 'node:process';
import { PaymentController } from './app/module/payment/payment.controller';
import corn from 'node-cron';
import { AppointmentService } from './app/module/appointment/appointment.service';
import AppError from './app/errorHelpers/AppError';
import status from 'http-status';

const app: Application = express();

app.set('view engine', 'ejs');
app.set('views', path.resolve(process.cwd(), `src/app/templates/`));

app.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  PaymentController.handleStripeWebhookEvent
);

app.use(
  cors({
    origin: [envVars.FRONTEND_URL as string, envVars.BETTER_AUTH_URL as string],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use('/api/auth', toNodeHandler(auth));

corn.schedule('0 0 * * *', async () => {
  try {
    await AppointmentService.cancelUnpaidAppointments();
  } catch (error) {
    console.log('Error canceling unpaid appointments:', error);
  }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1', IndexRoute);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello, World!');
});

app.use(globalErrorHandler);
app.use(notFoundMiddleware);

export default app;

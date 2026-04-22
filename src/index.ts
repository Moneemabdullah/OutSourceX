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

const app: Application = express();

app.set('view engine', 'ejs');
app.set('views', path.resolve(process.cwd(), 'src/app/templates/'));

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

app.use(globalErrorHandler);
app.use(notFoundMiddleware);

export default app;

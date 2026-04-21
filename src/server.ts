import { envVars } from './app/config/env.utils';
import { logger } from './app/lib/logger';
import app from './index';

const port = envVars.PORT;

const bootstrap = () => {
  try {
    app.listen(port, () => {
      logger.info(`Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    logger.error({ error }, 'Error starting the server');
  }
};

bootstrap();

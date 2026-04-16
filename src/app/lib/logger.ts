import pino from 'pino';
import { envVars } from '../config/env.utils.js';

const isDev = envVars.NODE_ENV === 'development';

export const logger = pino({
  level: isDev ? 'debug' : 'warn',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
});

export const createLogger = (moduleName: string) => {
  return {
    debug: (msg: string, data?: unknown) =>
      logger.debug({ module: moduleName, ...(data as Record<string, unknown>) }, msg),
    info: (msg: string, data?: unknown) =>
      logger.info({ module: moduleName, ...(data as Record<string, unknown>) }, msg),
    warn: (msg: string, data?: unknown) =>
      logger.warn({ module: moduleName, ...(data as Record<string, unknown>) }, msg),
    error: (msg: string, error?: unknown) => logger.error({ module: moduleName, error }, msg),
  };
};

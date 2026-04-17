import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { envVars } from '../config/env.utils.js';

const isDev = envVars.NODE_ENV === 'development';

// 📁 ensure .logger folder exists
const logDir = path.join(process.cwd(), '.logger');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 📁 file paths
const appLog = path.join(logDir, 'app.log');
const errorLog = path.join(logDir, 'error.log');

// 🔥 streams
const streams: pino.StreamEntry[] = [
  {
    level: 'debug',
    stream: pino.destination({ dest: appLog, sync: false }),
  },
  {
    level: 'error',
    stream: pino.destination({ dest: errorLog, sync: false }),
  },
];

// ✅ add console stream in dev mode (pino-pretty for pretty printing)
if (isDev) {
  streams.push({
    level: 'debug',
    stream: pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        // Use console output for proper display in dev
        destination: 1, // stdout
      },
    }),
  });
}

// 🔥 logger
export const logger = pino(
  {
    level: isDev ? 'debug' : 'info',
    formatters: {
      level: (label) => ({ level: label.toUpperCase() }),
    },
    base: {
      env: envVars.NODE_ENV,
      revision: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
    },
  },
  pino.multistream(streams)
);

// 🔥 module logger factory
export const createLogger = (moduleName: string) => {
  return {
    debug: (msg: string, data?: unknown) =>
      logger.debug({ module: moduleName, ...(data as object) }, msg),

    info: (msg: string, data?: unknown) =>
      logger.info({ module: moduleName, ...(data as object) }, msg),

    warn: (msg: string, data?: unknown) =>
      logger.warn({ module: moduleName, ...(data as object) }, msg),

    error: (msg: string, error?: unknown) => logger.error({ module: moduleName, error }, msg),
  };
};

export default logger;

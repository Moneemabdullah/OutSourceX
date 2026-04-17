import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent') || 'unknown',
    };

    if (res.statusCode >= 400) {
      logger.warn(logData, 'HTTP Request');
    } else {
      logger.info(logData, 'HTTP Request');
    }
  });

  next();
};

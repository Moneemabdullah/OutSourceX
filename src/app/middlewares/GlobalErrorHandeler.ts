import { NextFunction, Request, Response } from 'express';
import status from 'http-status';
import z from 'zod';
import { deleteFileFromCloudinary } from '../config/cloudinary.config';
import { envVars } from '../config/env.utils';
import AppError from '../errorHelpers/AppError';
import { handleZodError } from '../errorHelpers/handleZodError';
import { IErrorResponse, TErrorSource } from '../interfaces/error.interface';
import { logger } from '../lib/logger';

export const globalErrorHandler = async (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.warn(
      {
        statusCode: err.statusCode,
        message: err.message,
        path: req.path,
        method: req.method,
      },
      'AppError occurred'
    );
  } else if (err instanceof z.ZodError) {
    logger.warn(
      {
        errors: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        path: req.path,
        method: req.method,
      },
      'Zod validation error'
    );
  } else {
    logger.error(
      {
        error: err instanceof Error ? err.message : String(err),
        stack: envVars.NODE_ENV === 'development' && err instanceof Error ? err.stack : undefined,
        path: req.path,
        method: req.method,
      },
      'Unhandled error occurred'
    );
  }

  if (req.file) {
    await deleteFileFromCloudinary(req.file.path).catch(() => {});
  }

  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    for (const file of req.files) {
      await deleteFileFromCloudinary(file.path).catch(() => {});
    }
  }

  let errorSource: TErrorSource[] = [];
  let statusCode: number = status.INTERNAL_SERVER_ERROR;
  let message: string = err instanceof Error ? err.message : 'Internal Server Error';
  let stack: string | undefined = err instanceof Error ? err.stack : undefined;

  if (err instanceof z.ZodError) {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError.statusCode as number;
    message = simplifiedError.message;
    errorSource = [...(simplifiedError.errorSource || [])];
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    stack = err.stack;
    errorSource = [
      {
        path: 'AppError',
        message: err.message,
      },
    ];
  } else if (err instanceof Error) {
    statusCode = status.INTERNAL_SERVER_ERROR;
    message = err.message || 'Internal Server Error';
    stack = err.stack;
    errorSource = [
      {
        path: 'Error',
        message: err.message,
      },
    ];
  }

  const errorResponse: IErrorResponse = {
    success: false,
    message: message,
    errorSource: errorSource,
    error: envVars.NODE_ENV === 'development' ? err : undefined,
    stack: envVars.NODE_ENV === 'development' ? stack : undefined,
  };

  res.status(statusCode).json(errorResponse);
};

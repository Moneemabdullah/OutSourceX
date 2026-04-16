import { NextFunction, Request, Response } from 'express';
import status from 'http-status';
import z from 'zod';
import { envVars } from '../config/env.utils';
import AppError from '../errorHelpers/AppError';
import { handleZodError } from '../errorHelpers/handleZodError';
import { IErrorResponse, TErrorSource } from '../interfaces/error.interface';
import { deleteFileFromCloudinary } from '../config/cloudinary.config';

export const globalErrorHandler = async (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (envVars.NODE_ENV === 'development') {
    console.error(err);
  }

  if (req.file) {
    await deleteFileFromCloudinary(req.file.path);
  }

  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    for (const file of req.files) {
      await deleteFileFromCloudinary(file.path);
    }
  }

  let errorSource: TErrorSource[] = [];
  let statusCode: number = status.INTERNAL_SERVER_ERROR;
  let message: string = err.message || 'Internal Server Error';
  let stack: string | undefined = err.stack;

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

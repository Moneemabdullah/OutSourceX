import { logger } from 'better-auth';
import { NextFunction, Request, Response } from 'express';
import z from 'zod';

export const validateRequest = (schema: z.ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Handle multipart/form-data (stringified JSON)
      if (req.body?.data) {
        req.body = JSON.parse(req.body.data as string);
      }

      logger.debug(
        `Validating request for ${req.method} ${req.originalUrl} with data: ${JSON.stringify(req.body)}`
      );

      const scopedParse = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      if (scopedParse.success) {
        const { body, query, params } = scopedParse.data;

        // ✅ mutate instead of overwrite
        if (body) Object.assign(req.body, body);
        if (query) Object.assign(req.query, query);
        if (params) Object.assign(req.params, params);

        return next();
      }

      // fallback (only body validation)
      const bodyParse = schema.safeParse(req.body);

      if (!bodyParse.success) {
        return next(scopedParse.error);
      }

      Object.assign(req.body, bodyParse.data);
      return next();
    } catch (err) {
      return next(err);
    }
  };
};

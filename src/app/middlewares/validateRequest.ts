import { NextFunction, Request, Response } from 'express';
import z from 'zod';

export const validateRequest = (schema: z.ZodTypeAny) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.body?.data) {
      req.body = JSON.parse(req.body.data as string);
    }

    const scopedParse = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (scopedParse.success) {
      req.body = scopedParse.data.body ?? req.body;
      req.query = scopedParse.data.query ?? req.query;
      req.params = scopedParse.data.params ?? req.params;
      return next();
    }

    const bodyParse = schema.safeParse(req.body);

    if (!bodyParse.success) {
      return next(scopedParse.error);
    }

    req.body = bodyParse.data;
    return next();
  };
};

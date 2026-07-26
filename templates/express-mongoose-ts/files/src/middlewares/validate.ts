import { Request, Response, NextFunction } from "express";
import { Schema } from "joi";
import { AnyZodObject } from "zod";

export const validate = (schema: Schema | AnyZodObject) => (req: Request, _res: Response, next: NextFunction) => {
  try {
    // Determine validator based on schema type (Joi or Zod)
    if ('validate' in schema) { // Joi
      const { error, value } = (schema as Schema).validate(req.body, { abortEarly: false, stripUnknown: true });
      if (error) {
        throw new Error('Validation Error');
      }
      req.body = value;
    } else { // Zod
      const result = (schema as AnyZodObject).safeParse(req.body);
      if (!result.success) {
        throw new Error('Validation Error');
      }
      req.body = result.data;
    }
    next();
  } catch (err: any) {
    err.statusCode = 400; // Bad Request
    next(err);
  }
};

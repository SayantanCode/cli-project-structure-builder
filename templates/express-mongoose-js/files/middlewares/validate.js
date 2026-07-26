import { StatusCodes } from "http-status-codes";
import { env } from "../config/env.js";
import { joiUserSchema, zodUserSchema } from "../validators/user.validator.js";

// A utility to determine which validator to use
const getValidator = (name) => {
  if (env.VALIDATOR === 'joi') {
    return joiUserSchema[name];
  } else if (env.VALIDATOR === 'zod') {
    return zodUserSchema[name];
  }
  throw new Error('Invalid validator configured');
};

export const validateWith = (schema) => (req, res, next) => {
  try {
    if (env.VALIDATOR === 'joi') {
      const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
      if (error) {
        throw new Error(error.details.map(d => d.message).join(', '));
      }
      req.body = value;
    } else if (env.VALIDATOR === 'zod') {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        throw new Error(result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', '));
      }
      req.body = result.data;
    }
    next();
  } catch (err) {
    res.status(StatusCodes.BAD_REQUEST).json({ error: 'Validation Error', details: err.message });
  }
};

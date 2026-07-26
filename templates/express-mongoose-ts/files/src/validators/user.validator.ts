import Joi from "joi";
import { z } from "zod";

export const joiUserSchema = {
  createUser: Joi.object({
    name: Joi.string().min(2).max(120).required(),
    email: Joi.string().email().required(),
    role: Joi.string().valid("user", "admin").default("user")
  }),
  updateUser: Joi.object({
    name: Joi.string().min(2).max(120),
    email: Joi.string().email(),
    role: Joi.string().valid("user", "admin")
  }).min(1)
};

export const zodUserSchema = {
  createUser: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    role: z.enum(["user", "admin"]).default("user")
  }),
  updateUser: z.object({
    name: z.string().min(2).max(120).optional(),
    email: z.string().email().optional(),
    role: z.enum(["user", "admin"]).optional()
  }).refine((v) => Object.keys(v).length > 0, { message: "At least one field must be provided" })
};

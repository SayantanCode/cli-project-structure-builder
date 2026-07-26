import 'dotenv/config';
import Joi from 'joi';

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(4000),
  MONGO_URI: Joi.string().required().description('MongoDB connection URI'),
  REDIS_URI: Joi.string().optional().description('Redis connection URI'),
  VALIDATOR: Joi.string().valid('joi', 'zod').default('joi'),
}).unknown().required();

const { value: envVars, error } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const env = {
  NODE_ENV: envVars.NODE_ENV,
  PORT: envVars.PORT,
  MONGO_URI: envVars.MONGO_URI,
  REDIS_URI: envVars.REDIS_URI,
  VALIDATOR: envVars.VALIDATOR,
};

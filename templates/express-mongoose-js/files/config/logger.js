import pino from 'pino';
import winston from 'winston';

// You can choose your logger here.
// Pino is lightweight and fast.
const pinoLogger = pino();

// Winston is more versatile.
const winstonLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

export const logger = winstonLogger;

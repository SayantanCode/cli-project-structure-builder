import { Queue, Worker } from 'bullmq';
import { env } from './env.js';

const connection = {
  host: 'localhost',
  port: 6379,
  // Add more connection options as needed
};

// Check if redis is configured
if (!env.REDIS_URI) {
  console.warn("⚠️  REDIS_URI not set, BullMQ is disabled.");
}

export const bullmq = {
  createQueue: (name) => {
    if (!env.REDIS_URI) return null;
    return new Queue(name, { connection });
  },
  createWorker: (name, processor) => {
    if (!env.REDIS_URI) return null;
    return new Worker(name, processor, { connection });
  },
};

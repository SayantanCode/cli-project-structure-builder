import { env } from "./env.js";
import { db } from "./db.js";
import { logger } from "./logger.js";
import { redisClient } from "./redis.js";
import { bullmq } from "./bullmq.js";
import { swagger } from "./swagger.js";
import { socket } from "./socket.js";

export default {
  env,
  db,
  logger,
  redisClient,
  bullmq,
  swagger,
  socket
};

import { env } from "./env";
import { db } from "./db";
import { logger } from "./logger";
import { redisClient } from "./redis";
import { bullmq } from "./bullmq";
import { swagger } from "./swagger";
import { socket } from "./socket";

export default {
  env,
  db,
  logger,
  redisClient,
  bullmq,
  swagger,
  socket
};

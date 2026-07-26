import { createClient } from "redis";
import { env } from "./env";

const client = createClient({
  url: env.REDIS_URI
});

client.on("error", (err) => console.log("Redis Client Error", err));

export const redisClient = {
  connect: async () => {
    if (env.REDIS_URI) {
      await client.connect();
      console.log("✅ Redis client connected");
    } else {
      console.warn("⚠️  REDIS_URI not set, skipping Redis connection.");
    }
  },
  client,
};

import { Queue } from "bullmq";
import { env } from "../../config/env.js";

export const emailQueue = new Queue("emailQueue", {
  connection: {
    host: env.REDIS_URI,
    port: 6379,
  },
});

export const addEmailJob = (email, subject, body) => {
  emailQueue.add("sendEmail", { email, subject, body });
};

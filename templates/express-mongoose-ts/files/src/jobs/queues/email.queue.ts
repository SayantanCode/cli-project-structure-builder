import { Queue } from "bullmq";
import { env } from "../../config/env";

export const emailQueue = new Queue("emailQueue", {
  connection: {
    host: env.REDIS_URI,
    port: 6379,
  },
});

export const addEmailJob = (email: string, subject: string, body: string) => {
  emailQueue.add("sendEmail", { email, subject, body });
};

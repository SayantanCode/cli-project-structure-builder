import { Job, Worker } from "bullmq";
import { env } from "../../config/env";

const processor = async (job: Job) => {
  const { email, subject, body } = job.data;
  console.log(`[EmailProcessor] Sending email to ${email} with subject "${subject}"`);
  // Simulate sending email
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log("[EmailProcessor] Email sent successfully.");
};

export const emailWorker = new Worker("emailQueue", processor, {
  connection: {
    host: env.REDIS_URI,
    port: 6379,
  },
});

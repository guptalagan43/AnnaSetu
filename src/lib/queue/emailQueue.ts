import { Queue, Worker, Job } from "bullmq";
import { redis } from "./redis";

export const emailQueueName = "email";

export const emailQueue = new Queue(emailQueueName, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 60000, // 1min, 4min, 9min
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  priority?: "high" | "normal" | "low";
  metadata?: {
    listingId?: string;
    userId?: string;
    eventType?: string;
    logId?: string;
    [key: string]: unknown;
  };
}

export async function queueEmail(data: EmailJobData): Promise<string> {
  const job = await emailQueue.add("send-email", data, {
    priority: data.priority === "high" ? 10 : data.priority === "low" ? 1 : 5,
  });
  return job.id!;
}

export async function queueEmailBatch(emails: EmailJobData[]): Promise<string[]> {
  const jobs = await emailQueue.addBulk(
    emails.map((e) => ({
      name: "send-email",
      data: e,
      opts: {
        priority: e.priority === "high" ? 10 : e.priority === "low" ? 1 : 5,
      },
    }))
  );
  return jobs.map((j) => j.id!);
}
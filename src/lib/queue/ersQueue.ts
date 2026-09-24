import { Queue } from "bullmq";
import { redis } from "./redis";

export const ersQueueName = "ers";

export const ersQueue = new Queue(ersQueueName, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 30000,
    },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 50 },
  },
});

/**
 * Schedules a repeatable cron job running every 15 minutes
 */
export async function setupERSCron(): Promise<void> {
  try {
    await ersQueue.add(
      "recalculate-all-ers",
      { source: "cron" },
      {
        repeat: {
          pattern: "*/15 * * * *",
        },
        jobId: "ers-15min-cron",
      }
    );
    console.info("[ERS Queue] 15-min repeatable cron job scheduled successfully");
  } catch (error) {
    console.warn("[ERS Queue] Failed to schedule repeatable ERS cron:", error);
  }
}

/**
 * Triggers an immediate ERS recalculation job in the background queue
 */
export async function triggerERSJob(source: string = "manual"): Promise<string> {
  const job = await ersQueue.add(
    "recalculate-all-ers",
    { source, triggeredAt: new Date().toISOString() },
    { priority: 1 }
  );
  return job.id!;
}

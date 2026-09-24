/**
 * BullMQ Dispatcher Worker — Phase 14
 * Lazy-initialized so it doesn't block tests or builds when Redis is offline.
 */
import { Worker, Job } from "bullmq";
import { redis } from "../redis";
import { runDispatcherAgent } from "@/lib/dispatcher/agent";
import type { DispatcherRunResult } from "@/lib/dispatcher/agent";

let dispatcherWorkerInstance: Worker | null = null;

/**
 * Lazy initializer for BullMQ Dispatcher worker.
 * Pattern mirrors the ERS worker (Phase 08).
 */
export function getDispatcherWorker(): Worker {
  if (!dispatcherWorkerInstance) {
    dispatcherWorkerInstance = new Worker(
      "dispatcher",
      async (job: Job): Promise<DispatcherRunResult> => {
        console.info(`[Dispatcher Worker] Running job ${job.id} (name: ${job.name})...`);
        return await runDispatcherAgent();
      },
      {
        connection: redis,
        concurrency: 1,
      }
    );

    dispatcherWorkerInstance.on("completed", (job, result: DispatcherRunResult) => {
      console.info(
        `[Dispatcher Worker] Job ${job.id} completed: ${result.criticalListings} critical listings, ${result.actions.length} actions.`
      );
    });

    dispatcherWorkerInstance.on("failed", (job, err) => {
      console.error(`[Dispatcher Worker] Job ${job?.id} failed:`, err);
    });

    dispatcherWorkerInstance.on("error", (err) => {
      console.error("[Dispatcher Worker] Worker error:", err);
    });
  }

  return dispatcherWorkerInstance;
}

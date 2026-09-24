import { Worker, Job } from "bullmq";
import { redis } from "../redis";
import { sendEmail } from "@/lib/email/mailer";
import { createAdminClient } from "@/lib/supabase/admin";

interface EmailJobData {
  to: string;
  subject: string;
  html: string;
  text?: string;
  priority?: "high" | "normal" | "low";
  metadata?: {
    listingId?: string;
    userId?: string;
    eventType?: string;
  };
}

const supabase = createAdminClient();

export const emailWorker = new Worker<EmailJobData>(
  "email",
  async (job: Job<EmailJobData>) => {
    const { to, subject, html, text, metadata } = job.data;
    const attempt = job.attemptsMade + 1;

    console.info(`[Email Worker] Processing job ${job.id} (attempt ${attempt}/3)`, {
      to,
      subject,
      eventType: metadata?.eventType,
    });

    try {
      const result = await sendEmail({ to, subject, html, text });

      // Log successful send
      await supabase.from("email_logs").insert({
        job_id: job.id,
        to_email: to,
        subject,
        event_type: metadata?.eventType || "unknown",
        listing_id: metadata?.listingId || null,
        user_id: metadata?.userId || null,
        status: "sent",
        message_id: result.messageId,
        attempts: attempt,
        sent_at: new Date().toISOString(),
      });

      console.info(`[Email Worker] Email sent successfully`, { jobId: job.id, messageId: result.messageId });
      return { success: true, messageId: result.messageId };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      // Log failure
      await supabase.from("email_logs").insert({
        job_id: job.id,
        to_email: to,
        subject,
        event_type: metadata?.eventType || "unknown",
        listing_id: metadata?.listingId || null,
        user_id: metadata?.userId || null,
        status: attempt >= 3 ? "failed" : "retrying",
        error_message: message,
        attempts: attempt,
        sent_at: new Date().toISOString(),
      });

      console.error(`[Email Worker] Email failed (attempt ${attempt})`, { jobId: job.id, error: message });

      // Re-throw to trigger retry
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 5,
  }
);

emailWorker.on("completed", (job) => {
  console.info(`[Email Worker] Job completed`, { jobId: job.id });
});

emailWorker.on("failed", (job, err) => {
  console.error(`[Email Worker] Job failed permanently`, { jobId: job?.id, error: err?.message });
});

emailWorker.on("error", (err) => {
  console.error("[Email Worker] Worker error:", err);
});
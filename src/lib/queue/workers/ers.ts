import { Worker, Job } from "bullmq";
import { redis } from "../redis";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateERS } from "@/lib/ers/calculator";
import { cacheListingERS } from "@/lib/ers/cache";
import { getOutdoorTemperature } from "@/lib/ers/weather";
import { queueEmail } from "@/lib/queue/emailQueue";
import { renderERSAlert } from "@/lib/email/templates";
import { parseCoordinates } from "@/lib/ers/coordinates";

export { parseCoordinates };

export interface ERSJobResult {
  success: boolean;
  totalActive: number;
  updated: number;
  escalated: number;
  expired: number;
  durationMs: number;
  errors: string[];
}

/**
 * Core ERS Recalculation Engine
 * Processes all active listings, updates ERS scores in DB & Redis,
 * triggers escalation emails when ERS >= 81, and auto-cancels when ERS >= 96.
 */
export async function recalculateAllERS(): Promise<ERSJobResult> {
  const startTime = Date.now();
  const supabase = createAdminClient();
  const errors: string[] = [];

  console.info("[ERS Engine] Starting 15-minute ERS recalculation batch...");

  // Query all active listings
  const { data: listings, error: fetchError } = await supabase
    .from("listings")
    .select(`
      id,
      title,
      food_category,
      quantity_kg,
      estimated_servings,
      expiry_time,
      pickup_location,
      pickup_address,
      status,
      ers_score,
      donor_id,
      profiles!listings_donor_id_fkey(id, email, display_name)
    `)
    .in("status", ["listed", "matched", "driver_assigned", "in_transit", "checklist"]);

  if (fetchError) {
    const msg = `[ERS Engine] Failed to fetch active listings: ${fetchError.message}`;
    console.error(msg);
    return {
      success: false,
      totalActive: 0,
      updated: 0,
      escalated: 0,
      expired: 0,
      durationMs: Date.now() - startTime,
      errors: [msg],
    };
  }

  let updatedCount = 0;
  let escalatedCount = 0;
  let expiredCount = 0;

  for (const listing of listings || []) {
    try {
      // 1. Resolve location and weather adjustment
      const coords = parseCoordinates(listing.pickup_location);
      let outdoorTemp: number | null = null;
      if (coords) {
        outdoorTemp = await getOutdoorTemperature(coords.lat, coords.lng);
      }

      // 2. Compute live ERS
      const ersBreakdown = calculateERS({
        foodCategory: listing.food_category,
        expiryTime: listing.expiry_time,
        status: listing.status,
        outdoorTempCelsius: outdoorTemp,
      });

      const newScore = ersBreakdown.score;
      const prevScore = listing.ers_score ?? 0;
      const nowIso = new Date().toISOString();

      // 3. Auto-expire if ERS >= 96 (SRS §8.4 & §8.5: Expiring threshold auto-cancelled)
      if (ersBreakdown.isAutoExpired) {
        await supabase
          .from("listings")
          .update({
            status: "expired",
            ers_score: newScore,
            ers_updated_at: nowIso,
            updated_at: nowIso,
          })
          .eq("id", listing.id);

        // Cache expired score
        await cacheListingERS(listing.id, newScore, 900);

        // Log waste event in notification_logs
        await supabase.from("notification_logs").insert({
          recipient_id: listing.donor_id,
          event_type: "listing_expired_auto",
          listing_id: listing.id,
          status: "sent",
        });

        expiredCount++;
        console.warn(`[ERS Engine] Listing ${listing.id} (${listing.title}) reached ERS ${newScore} — AUTO EXPIRED.`);
        continue;
      }

      // 4. Update listing ERS score in DB
      const { error: updateError } = await supabase
        .from("listings")
        .update({
          ers_score: newScore,
          ers_updated_at: nowIso,
        })
        .eq("id", listing.id);

      if (updateError) {
        throw updateError;
      }

      // 5. Update Redis cache with 15-minute TTL
      await cacheListingERS(listing.id, newScore, 900);
      updatedCount++;

      // 6. Check for escalation email trigger: ERS >= 81 (SRS §8.4 / FR-ERS-06)
      if (ersBreakdown.shouldEscalate && prevScore < 80) {
        const donorProfile = Array.isArray(listing.profiles) ? listing.profiles[0] : listing.profiles;
        const donorEmail = donorProfile?.email;
        const donorName = donorProfile?.display_name || "Food Donor";

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://annasetu.in";
        const actionUrl = `${appUrl}/donor`;

        if (donorEmail) {
          const donorHtml = await renderERSAlert({
            donorName,
            listingTitle: listing.title,
            ersScore: newScore,
            foodCategory: listing.food_category,
            quantityKg: Number(listing.quantity_kg) || 0,
            servings: listing.estimated_servings || 0,
            expiryTime: listing.expiry_time,
            actionUrl,
            recipientType: "donor",
          });

          await queueEmail({
            to: donorEmail,
            subject: `🔴 URGENT: High Expiry Risk (${newScore}/100) — ${listing.title}`,
            html: donorHtml,
            priority: "high",
            metadata: {
              listingId: listing.id,
              userId: listing.donor_id,
              eventType: "ers_critical_alert",
            },
          });
        }

        // Also alert admin if configured
        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
        if (adminEmail) {
          const adminHtml = await renderERSAlert({
            donorName: "Platform Admin",
            listingTitle: listing.title,
            ersScore: newScore,
            foodCategory: listing.food_category,
            quantityKg: Number(listing.quantity_kg) || 0,
            servings: listing.estimated_servings || 0,
            expiryTime: listing.expiry_time,
            actionUrl: `${appUrl}/admin`,
            recipientType: "admin",
          });

          await queueEmail({
            to: adminEmail,
            subject: `[ADMIN ALERT] ERS Critical Escalation: ${newScore}/100 — ${listing.title}`,
            html: adminHtml,
            priority: "high",
            metadata: {
              listingId: listing.id,
              eventType: "ers_admin_escalation",
            },
          });
        }

        // Log notification to DB
        await supabase.from("notification_logs").insert({
          recipient_id: listing.donor_id,
          event_type: "ers_critical_escalation",
          listing_id: listing.id,
          status: "queued",
        });

        escalatedCount++;
        console.info(`[ERS Engine] Escalation email queued for listing ${listing.id} (ERS: ${newScore})`);
      }
    } catch (err) {
      const msg = `Error processing listing ${listing.id}: ${err instanceof Error ? err.message : "Unknown error"}`;
      console.error("[ERS Engine]", msg);
      errors.push(msg);
    }
  }

  const durationMs = Date.now() - startTime;
  console.info(
    `[ERS Engine] Recalculation complete in ${durationMs}ms: ${updatedCount} updated, ${escalatedCount} escalated, ${expiredCount} expired.`
  );

  return {
    success: errors.length === 0,
    totalActive: listings?.length || 0,
    updated: updatedCount,
    escalated: escalatedCount,
    expired: expiredCount,
    durationMs,
    errors,
  };
}

let ersWorkerInstance: Worker | null = null;

/**
 * Lazy initializer for BullMQ ERS worker
 */
export function getERSWorker(): Worker {
  if (!ersWorkerInstance) {
    ersWorkerInstance = new Worker(
      "ers",
      async (job: Job) => {
        console.info(`[ERS Worker] Running job ${job.id} (name: ${job.name})...`);
        return await recalculateAllERS();
      },
      {
        connection: redis,
        concurrency: 1,
      }
    );

    ersWorkerInstance.on("completed", (job, result) => {
      console.info(`[ERS Worker] Job ${job.id} completed:`, result);
    });

    ersWorkerInstance.on("failed", (job, err) => {
      console.error(`[ERS Worker] Job ${job?.id} failed:`, err);
    });

    ersWorkerInstance.on("error", (err) => {
      console.error("[ERS Worker] Worker error:", err);
    });
  }

  return ersWorkerInstance;
}

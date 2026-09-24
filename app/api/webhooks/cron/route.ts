import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const CRON_SECRET = process.env.CRON_SECRET;

async function verifyCronRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = request.nextUrl.searchParams.get("secret") || request.headers.get("x-cron-secret");
  
  if (CRON_SECRET && cronSecret !== CRON_SECRET) {
    return false;
  }
  
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return false;
  }
  
  return true;
}

async function runERSRecalculation(supabase: ReturnType<typeof createAdminClient>) {
  console.log("[CRON] Starting ERS recalculation...");
  
  // Get all active listings that need ERS recalculation
  const { data: listings, error } = await supabase
    .from("listings")
    .select("id, food_category, expiry_time, pickup_location, donor_id, status, quantity_kg")
    .in("status", ["listed", "matched", "driver_assigned", "in_transit", "checklist"])
    .gt("expiry_time", new Date().toISOString());

  if (error) {
    console.error("[CRON] Error fetching listings:", error);
    return { success: false, error: error.message };
  }

  let updated = 0;
  let alertsSent = 0;

  for (const listing of listings || []) {
    try {
      const ersScore = calculateERS(listing);
      
      // Update ERS score
      const { error: updateError } = await supabase
        .from("listings")
        .update({ 
          ers_score: ersScore,
          ers_updated_at: new Date().toISOString()
        })
        .eq("id", listing.id);

      if (updateError) {
        console.error(`[CRON] Error updating ERS for ${listing.id}:`, updateError);
        continue;
      }

      updated++;

      // Check for ERS threshold alerts
      if (ersScore >= 81) {
        // TODO: Queue escalation email
        alertsSent++;
      } else if (ersScore >= 96) {
        // Auto-expire listing
        await supabase
          .from("listings")
          .update({ status: "expired" })
          .eq("id", listing.id);
        
        // Log waste event
        await supabase
          .from("notification_logs")
          .insert({
            recipient_id: listing.donor_id,
            event_type: "listing_expired",
            listing_id: listing.id,
            status: "queued"
          });
      }
    } catch (err) {
      console.error(`[CRON] Error processing listing ${listing.id}:`, err);
    }
  }

  console.log(`[CRON] ERS recalculation complete. Updated: ${updated}, Alerts: ${alertsSent}`);
  return { success: true, updated, alertsSent };
}

function calculateERS(listing: {
  food_category: string;
  expiry_time: string;
  pickup_location: { coordinates: number[] };
  quantity_kg?: number | null;
  status: string;
}): number {
  const now = new Date();
  const expiryTime = new Date(listing.expiry_time);
  const timeRemainingHours = (expiryTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (timeRemainingHours <= 0) return 100;

  // Base safe windows by category (hours)
  const safeWindows: Record<string, number> = {
    cooked_meat_fish: 2,
    dairy_dish: 3,
    cooked_rice_curry: 4,
    cooked_pasta: 4,
    soup_broth: 4,
    baked_bread: 8,
    fresh_produce: 12,
    packaged_sealed: 24,
    beverage_opened: 6,
  };

  const maxSafeWindow = safeWindows[listing.food_category] || 4;
  const baseRisk = Math.max(0, (1 - timeRemainingHours / maxSafeWindow)) * 100;

  // Category multipliers
  const multipliers: Record<string, number> = {
    cooked_meat_fish: 2.0,
    dairy_dish: 1.8,
    cooked_rice_curry: 1.5,
    cooked_pasta: 1.4,
    soup_broth: 1.4,
    baked_bread: 1.0,
    fresh_produce: 0.8,
    packaged_sealed: 0.5,
    beverage_opened: 0.9,
  };

  const multiplier = multipliers[listing.food_category] || 1.0;
  let score = Math.min(100, baseRisk * multiplier);

  // Adjustments
  if (listing.status === "matched") score -= 10;
  if (listing.status === "driver_assigned" || listing.status === "in_transit") score -= 20;
  
  // Temperature adjustment would need weather API
  // For now, skip

  return Math.min(100, Math.max(0, Math.round(score)));
}

async function runDispatcher(supabase: ReturnType<typeof createAdminClient>) {
  console.log("[CRON] Starting agentic dispatcher...");
  
  // Get critical listings that need dispatcher action
  const { data: criticalListings, error } = await supabase
    .from("listings")
    .select("id, ers_score, status, donor_id, pickup_location, food_category, quantity_kg")
    .eq("status", "listed")
    .gte("ers_score", 80)
    .gt("expiry_time", new Date().toISOString());

  if (error) {
    console.error("[CRON] Error fetching critical listings:", error);
    return { success: false, error: error.message };
  }

  let actions = 0;

  for (const listing of criticalListings || []) {
    try {
      // Find available shelters within 5km
      const { data: shelters } = await supabase.rpc("find_nearby_shelters", {
        listing_location: listing.pickup_location,
        max_distance_km: 5,
        required_capacity_kg: listing.quantity_kg || 0,
        food_category: listing.food_category,
      });

      if (shelters && shelters.length > 0) {
        const bestShelter = shelters[0];
        
        // Check if shelter accepts auto-confirm
        if (bestShelter.accepts_auto_confirm) {
          // Create match
          const { error: matchError } = await supabase
            .from("matches")
            .insert({
              listing_id: listing.id,
              shelter_id: bestShelter.id,
              match_score: bestShelter.match_score,
              distance_km: bestShelter.distance_km,
              status: "auto_confirmed",
              auto_confirmed: true,
            });

          if (!matchError) {
            // Update listing status
            await supabase
              .from("listings")
              .update({ status: "matched" })
              .eq("id", listing.id);

            // Log agent action
            await supabase
              .from("agent_logs")
              .insert({
                action: "AUTO_CONFIRM_SHELTER",
                listing_id: listing.id,
                match_id: (await supabase
                  .from("matches")
                  .select("id")
                  .eq("listing_id", listing.id)
                  .single()).data?.id,
                reasoning: `Auto-confirmed shelter ${bestShelter.name} (${bestShelter.distance_km}km, score: ${bestShelter.match_score}) due to ERS ${listing.ers_score}`,
                confidence: 0.85,
              });

            // Queue notification to shelter
            await supabase
              .from("notification_logs")
              .insert({
                recipient_id: bestShelter.profile_id,
                event_type: "auto_confirm_shelter",
                listing_id: listing.id,
                status: "queued",
              });

            actions++;
          }
        }
      }
    } catch (err) {
      console.error(`[CRON] Error dispatching for listing ${listing.id}:`, err);
    }
  }

  console.log(`[CRON] Dispatcher complete. Actions: ${actions}`);
  return { success: true, actions };
}

export async function GET(request: NextRequest) {
  const job = request.nextUrl.searchParams.get("job");

  if (!CRON_SECRET) {
    console.warn("[CRON] CRON_SECRET not set, skipping verification");
  } else {
    const verified = await verifyCronRequest(request);
    if (!verified) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createAdminClient();

  try {
    switch (job) {
      case "ers":
        const ersResult = await runERSRecalculation(supabase);
        return NextResponse.json(ersResult);
      
      case "dispatcher":
        const dispatcherResult = await runDispatcher(supabase);
        return NextResponse.json(dispatcherResult);
      
      case "digest":
        // Weekly digest - placeholder
        return NextResponse.json({ success: true, message: "Digest job triggered" });
      
      default:
        return NextResponse.json({ error: "Invalid job parameter" }, { status: 400 });
    }
  } catch (error) {
    console.error("[CRON] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
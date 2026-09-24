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

import { recalculateAllERS } from "@/lib/queue/workers/ers";



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
        const ersResult = await recalculateAllERS();
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
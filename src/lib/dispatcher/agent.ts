/**
 * Agentic Dispatcher — AnnaSetu Phase 14
 *
 * Trigger conditions (rules.md §5 / phases.md §14):
 *   - ERS > 80
 *   - Listing is still `listed` (no accepted match yet)
 *   - match has been pending > PENDING_TIMEOUT_MINUTES OR no match exists at all
 *
 * Actions (in order of preference):
 *   AUTO_CONFIRM_SHELTER  — shelter.accepts_auto_confirm = true → create auto-confirmed match
 *   ASSIGN_DRIVER         — driver is available → create driver_assignment as 'agent'
 *   ESCALATE_TO_ADMIN     — nothing available → log escalation, alert admin by email
 *
 * Every action:
 *   - Is logged to agent_logs with reasoning + confidence
 *   - Checks agent_logs first to prevent duplicate actions within the same run window
 *   - Sends SMTP notification to all affected parties
 *   - Is reversible by admin via the override endpoint
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { rankShelterCandidates, haversineDistanceKm } from "@/lib/matching/engine";
import { parseCoordinates } from "@/lib/ers/coordinates";
import { queueEmail } from "@/lib/queue/emailQueue";
import {
  renderAutoConfirmShelter,
  renderEscalateToAdmin,
  renderDriverAssigned,
} from "@/lib/email/templates";
import type { ShelterCandidate, ListingMatchInput } from "@/lib/matching/engine";

// How long a match is allowed to be pending before the dispatcher intervenes
const PENDING_TIMEOUT_MINUTES = Number(process.env.DISPATCHER_TIMEOUT_MINUTES ?? "10");

export type DispatcherAction =
  | "AUTO_CONFIRM_SHELTER"
  | "ASSIGN_DRIVER"
  | "ESCALATE_TO_ADMIN"
  | "SKIP_ALREADY_ACTIONED"
  | "SKIP_NO_TRIGGER";

export interface DispatcherActionResult {
  listingId: string;
  action: DispatcherAction;
  targetId?: string;       // shelter_id or driver_id
  targetName?: string;
  reasoning: string;
  confidence: number;
  agentLogId?: string;
}

export interface DispatcherRunResult {
  success: boolean;
  criticalListings: number;
  actions: DispatcherActionResult[];
  durationMs: number;
  errors: string[];
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Returns true if the dispatcher has already acted on this listing
 * within the current 2-minute window (prevents duplicate actions from
 * multiple cron invocations if Vercel fires slightly early/late).
 */
async function alreadyActioned(
  listingId: string,
  supabase: ReturnType<typeof createAdminClient>
): Promise<boolean> {
  const windowStart = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("agent_logs")
    .select("id")
    .eq("listing_id", listingId)
    .not("action", "eq", "ESCALATE_TO_ADMIN") // escalations can repeat
    .gte("created_at", windowStart)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

/**
 * Checks whether a pending match has been waiting longer than the timeout.
 * Returns true if dispatcher should act, false if human still has time.
 */
function isPendingTimedOut(matchCreatedAt: string): boolean {
  const createdMs = new Date(matchCreatedAt).getTime();
  const elapsedMin = (Date.now() - createdMs) / 60_000;
  return elapsedMin >= PENDING_TIMEOUT_MINUTES;
}

// ─── Action: AUTO_CONFIRM_SHELTER ─────────────────────────────────────────────

async function autoConfirmShelter(
  listing: ListingInput,
  supabase: ReturnType<typeof createAdminClient>
): Promise<DispatcherActionResult> {
  const coords = parseCoordinates(listing.pickup_location);
  if (!coords) {
    return buildResult(listing.id, "ESCALATE_TO_ADMIN", "No valid coordinates on listing", 0.5);
  }

  // Fetch shelters that accept auto-confirm
  const { data: dbShelters } = await supabase
    .from("shelters")
    .select("*")
    .eq("status", "active")
    .eq("accepts_auto_confirm", true);

  const candidates: ShelterCandidate[] = [];
  for (const s of dbShelters ?? []) {
    const sCoords = parseCoordinates(s.location);
    if (!sCoords) continue;
    const cap = Number(s.capacity_kg) || 0;
    const load = Number(s.current_load_kg) || 0;
    candidates.push({
      id: s.id,
      profile_id: s.profile_id,
      name: s.name,
      address: s.address,
      location: s.location,
      latitude: sCoords.lat,
      longitude: sCoords.lng,
      capacity_kg: cap,
      current_load_kg: load,
      available_capacity_kg: Math.max(0, cap - load),
      food_preferences: s.food_preferences,
      food_restrictions: s.food_restrictions,
      reliability_score: s.reliability_score ? Number(s.reliability_score) : 0.7,
      status: s.status,
    });
  }

  const listingInput: ListingMatchInput = {
    id: listing.id,
    title: listing.title,
    food_category: listing.food_category,
    quantity_kg: Number(listing.quantity_kg) || 0,
    latitude: coords.lat,
    longitude: coords.lng,
    ers_score: listing.ers_score ?? 0,
    allergens: listing.allergens,
  };

  const { ranked } = rankShelterCandidates(listingInput, candidates);
  if (ranked.length === 0) {
    return buildResult(listing.id, "ESCALATE_TO_ADMIN", "No auto-confirm shelter available within 15 km", 0.6);
  }

  const best = ranked[0];

  // Create the match as auto_confirmed
  const { data: match, error: matchErr } = await supabase
    .from("matches")
    .insert({
      listing_id: listing.id,
      shelter_id: best.shelter.id,
      match_score: best.matchScore,
      distance_km: best.distanceKm,
      status: "auto_confirmed",
      auto_confirmed: true,
    })
    .select("id")
    .single();

  if (matchErr) {
    return buildResult(listing.id, "ESCALATE_TO_ADMIN", `Failed to create match: ${matchErr.message}`, 0.4);
  }

  // Advance listing to matched
  await supabase
    .from("listings")
    .update({ status: "matched", updated_at: new Date().toISOString() })
    .eq("id", listing.id);

  // Log to agent_logs
  const reasoning = `Auto-confirmed ${best.shelter.name} (${best.distanceKm} km, score ${best.matchScore}) due to ERS ${listing.ers_score}`;
  const confidence = Math.min(0.98, 0.7 + best.matchScore * 0.3);

  const { data: logRow } = await supabase
    .from("agent_logs")
    .insert({
      action: "AUTO_CONFIRM_SHELTER",
      listing_id: listing.id,
      match_id: match?.id,
      reasoning,
      confidence,
    })
    .select("id")
    .single();

  // Queue notification email to shelter
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://annasetu.in";
  try {
    const { data: shelterProfile } = await supabase
      .from("profiles")
      .select("email, display_name")
      .eq("id", best.shelter.profile_id ?? "")
      .single();

    if (shelterProfile?.email) {
      const html = await renderAutoConfirmShelter({
        shelterName: best.shelter.name,
        recipientName: shelterProfile.display_name || best.shelter.name,
        listingTitle: listing.title,
        foodCategory: listing.food_category,
        quantityKg: Number(listing.quantity_kg) || 0,
        ersScore: listing.ers_score ?? 0,
        pickupAddress: listing.pickup_address,
        optOutUrl: `${appUrl}/api/dispatcher/opt-out?match_id=${match?.id}`,
        dashboardUrl: `${appUrl}/shelter`,
      });

      await queueEmail({
        to: shelterProfile.email,
        subject: `[AUTO-CONFIRMED] Food Rescue Match — ${listing.title}`,
        html,
        priority: "high",
        metadata: {
          listingId: listing.id,
          eventType: "dispatcher_auto_confirm",
        },
      });
    }
  } catch (emailErr) {
    // rules.md: never throw on email failure
    console.error("[Dispatcher] Auto-confirm email failed:", emailErr);
  }

  return {
    listingId: listing.id,
    action: "AUTO_CONFIRM_SHELTER",
    targetId: best.shelter.id,
    targetName: best.shelter.name,
    reasoning,
    confidence,
    agentLogId: logRow?.id,
  };
}

// ─── Action: ASSIGN_DRIVER ────────────────────────────────────────────────────

async function assignDriver(
  listing: ListingInput,
  supabase: ReturnType<typeof createAdminClient>
): Promise<DispatcherActionResult> {
  const coords = parseCoordinates(listing.pickup_location);

  // Fetch available verified drivers
  const { data: drivers } = await supabase
    .from("drivers")
    .select("id, profile_id, current_location, vehicle_type, reliability_score")
    .eq("is_available", true);

  if (!drivers || drivers.length === 0) {
    return buildResult(listing.id, "ESCALATE_TO_ADMIN", "No available drivers", 0.5);
  }

  // Rank drivers by proximity to pickup (nearest first)
  interface RankedDriver {
    id: string;
    profile_id: string;
    distanceKm: number;
    vehicle_type: string;
  }

  const ranked: RankedDriver[] = [];

  for (const d of drivers) {
    if (!d.current_location) continue;
    const dCoords = parseCoordinates(d.current_location);
    if (!dCoords || !coords) continue;
    const dist = haversineDistanceKm(coords.lat, coords.lng, dCoords.lat, dCoords.lng);
    ranked.push({ id: d.id, profile_id: d.profile_id, distanceKm: dist, vehicle_type: d.vehicle_type });
  }

  ranked.sort((a, b) => a.distanceKm - b.distanceKm);

  if (ranked.length === 0) {
    return buildResult(listing.id, "ESCALATE_TO_ADMIN", "No drivers with known location", 0.5);
  }

  const best = ranked[0];

  // Create driver assignment
  const { data: assignment, error: assignErr } = await supabase
    .from("driver_assignments")
    .insert({
      driver_id: best.id,
      listing_id: listing.id,
      assigned_by: "agent",
      status: "assigned",
    })
    .select("id")
    .single();

  if (assignErr) {
    return buildResult(listing.id, "ESCALATE_TO_ADMIN", `Driver assignment failed: ${assignErr.message}`, 0.4);
  }

  // Advance listing to driver_assigned
  await supabase
    .from("listings")
    .update({ status: "driver_assigned", updated_at: new Date().toISOString() })
    .eq("id", listing.id);

  const reasoning = `Assigned nearest available driver (${best.distanceKm.toFixed(1)} km, ${best.vehicle_type ?? "unknown vehicle"}) due to ERS ${listing.ers_score}`;
  const confidence = Math.min(0.95, 0.65 + (1 - Math.min(best.distanceKm / 15, 1)) * 0.3);

  const { data: logRow } = await supabase
    .from("agent_logs")
    .insert({
      action: "ASSIGN_DRIVER",
      listing_id: listing.id,
      driver_id: best.id,
      reasoning,
      confidence,
    })
    .select("id")
    .single();

  // Queue driver notification
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://annasetu.in";
    const { data: driverProfile } = await supabase
      .from("profiles")
      .select("email, display_name")
      .eq("id", best.profile_id ?? "")
      .single();

    if (driverProfile?.email) {
      const { renderDriverAssigned } = await import("@/lib/email/templates");
      const html = await renderDriverAssigned({
        driverName: driverProfile.display_name || "Driver",
        listingTitle: listing.title,
        pickupAddress: listing.pickup_address,
        dashboardUrl: `${appUrl}/driver`,
        recipientType: "driver",
        shelterName: "",
        shelterAddress: "",
      });
      await queueEmail({
        to: driverProfile.email,
        subject: `[AUTO-ASSIGNED] New Pickup — ${listing.title}`,
        html,
        priority: "high",
        metadata: { listingId: listing.id, eventType: "dispatcher_assign_driver" },
      });
    }
  } catch (emailErr) {
    console.error("[Dispatcher] Driver assignment email failed:", emailErr);
  }

  // Suppress unused variable warning
  void assignment;

  return {
    listingId: listing.id,
    action: "ASSIGN_DRIVER",
    targetId: best.id,
    targetName: `Driver (${best.vehicle_type ?? "unknown"})`,
    reasoning,
    confidence,
    agentLogId: logRow?.id,
  };
}

// ─── Action: ESCALATE_TO_ADMIN ────────────────────────────────────────────────

async function escalateToAdmin(
  listing: ListingInput,
  reason: string,
  supabase: ReturnType<typeof createAdminClient>
): Promise<DispatcherActionResult> {
  const reasoning = `Escalated to admin: ${reason}. ERS ${listing.ers_score} — human intervention required.`;
  const confidence = 0.99; // escalation is always high confidence

  const { data: logRow } = await supabase
    .from("agent_logs")
    .insert({
      action: "ESCALATE_TO_ADMIN",
      listing_id: listing.id,
      reasoning,
      confidence,
    })
    .select("id")
    .single();

  // Email admin
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  if (adminEmail) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://annasetu.in";
      const html = await renderEscalateToAdmin({
        listingTitle: listing.title,
        listingId: listing.id,
        ersScore: listing.ers_score ?? 0,
        reason,
        adminUrl: `${appUrl}/admin`,
        pickupAddress: listing.pickup_address,
        foodCategory: listing.food_category,
        quantityKg: Number(listing.quantity_kg) || 0,
      });
      await queueEmail({
        to: adminEmail,
        subject: `[ESCALATION] Manual Intervention Required — ERS ${listing.ers_score} — ${listing.title}`,
        html,
        priority: "high",
        metadata: { listingId: listing.id, eventType: "dispatcher_escalate_admin" },
      });
    } catch (emailErr) {
      console.error("[Dispatcher] Escalation email failed:", emailErr);
    }
  }

  return {
    listingId: listing.id,
    action: "ESCALATE_TO_ADMIN",
    reasoning,
    confidence,
    agentLogId: logRow?.id,
  };
}

// ─── Listing type (minimal fields needed by dispatcher) ───────────────────────

interface ListingInput {
  id: string;
  title: string;
  food_category: string;
  quantity_kg: number | null;
  estimated_servings: number | null;
  ers_score: number | null;
  pickup_location: unknown;
  pickup_address: string;
  allergens?: string[];
  status: string;
}

function buildResult(
  listingId: string,
  action: DispatcherAction,
  reasoning: string,
  confidence: number
): DispatcherActionResult {
  return { listingId, action, reasoning, confidence };
}

// ─── Main dispatcher run ──────────────────────────────────────────────────────

/**
 * Runs one full dispatcher cycle. Called every 2 minutes by Vercel cron.
 * Idempotent — safe to call multiple times in quick succession.
 */
export async function runDispatcherAgent(): Promise<DispatcherRunResult> {
  const startTime = Date.now();
  const supabase = createAdminClient();
  const actions: DispatcherActionResult[] = [];
  const errors: string[] = [];

  console.info("[Dispatcher] Starting agentic dispatcher cycle...");

  // 1. Find all listed critical listings (ERS > 80, not yet matched, not expired)
  const { data: criticalListings, error: fetchErr } = await supabase
    .from("listings")
    .select(
      "id, title, food_category, quantity_kg, estimated_servings, ers_score, pickup_location, pickup_address, allergens, status"
    )
    .eq("status", "listed")
    .gte("ers_score", 80)
    .gt("expiry_time", new Date().toISOString())
    .order("ers_score", { ascending: false })
    .limit(50); // rules.md: max 50 per run

  if (fetchErr) {
    const msg = `[Dispatcher] Failed to fetch critical listings: ${fetchErr.message}`;
    console.error(msg);
    return { success: false, criticalListings: 0, actions: [], durationMs: Date.now() - startTime, errors: [msg] };
  }

  console.info(`[Dispatcher] Found ${criticalListings?.length ?? 0} critical listings.`);

  for (const listing of criticalListings ?? []) {
    try {
      // 2. Guard: already actioned this listing in last 2 min window?
      if (await alreadyActioned(listing.id, supabase)) {
        actions.push({
          listingId: listing.id,
          action: "SKIP_ALREADY_ACTIONED",
          reasoning: "Dispatcher already acted on this listing in the current 2-minute window",
          confidence: 1.0,
        });
        continue;
      }

      // 3. Check for pending match — does one already exist?
      const { data: pendingMatches } = await supabase
        .from("matches")
        .select("id, status, created_at, shelter_id")
        .eq("listing_id", listing.id)
        .in("status", ["pending"])
        .order("created_at", { ascending: false })
        .limit(1);

      const hasPendingMatch = pendingMatches && pendingMatches.length > 0;
      const pendingTimedOut = hasPendingMatch
        ? isPendingTimedOut(pendingMatches[0].created_at)
        : false;

      // If there is a fresh pending match, skip — let the shelter respond
      if (hasPendingMatch && !pendingTimedOut) {
        actions.push({
          listingId: listing.id,
          action: "SKIP_NO_TRIGGER",
          reasoning: `Pending match exists and is within ${PENDING_TIMEOUT_MINUTES}-minute timeout window`,
          confidence: 1.0,
        });
        continue;
      }

      // 4. Attempt AUTO_CONFIRM_SHELTER first (highest preference)
      const shelterResult = await autoConfirmShelter(listing, supabase);
      if (shelterResult.action === "AUTO_CONFIRM_SHELTER") {
        actions.push(shelterResult);
        console.info(`[Dispatcher] AUTO_CONFIRM_SHELTER for listing ${listing.id} → ${shelterResult.targetName}`);
        continue;
      }

      // 5. No auto-confirm shelter → try ASSIGN_DRIVER directly
      //    only for ERS >= 90 (extreme urgency)
      if ((listing.ers_score ?? 0) >= 90) {
        const driverResult = await assignDriver(listing, supabase);
        if (driverResult.action === "ASSIGN_DRIVER") {
          actions.push(driverResult);
          console.info(`[Dispatcher] ASSIGN_DRIVER for listing ${listing.id} → ${driverResult.targetName}`);
          continue;
        }
      }

      // 6. Nothing worked → ESCALATE_TO_ADMIN
      const escalationReason =
        shelterResult.action === "ESCALATE_TO_ADMIN" ? shelterResult.reasoning : "No auto-confirm shelter or driver available";
      const escalateResult = await escalateToAdmin(listing, escalationReason, supabase);
      actions.push(escalateResult);
      console.warn(`[Dispatcher] ESCALATE_TO_ADMIN for listing ${listing.id}: ${escalationReason}`);
    } catch (err) {
      const msg = `Error dispatching listing ${listing.id}: ${err instanceof Error ? err.message : "Unknown error"}`;
      console.error("[Dispatcher]", msg);
      errors.push(msg);
    }
  }

  const durationMs = Date.now() - startTime;
  const realActions = actions.filter((a) => !a.action.startsWith("SKIP"));
  console.info(
    `[Dispatcher] Cycle complete in ${durationMs}ms: ${realActions.length} actions taken, ${errors.length} errors.`
  );

  return {
    success: errors.length === 0,
    criticalListings: criticalListings?.length ?? 0,
    actions,
    durationMs,
    errors,
  };
}

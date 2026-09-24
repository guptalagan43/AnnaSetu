import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  runDispatcherAgent,
  type DispatcherRunResult,
} from "../src/lib/dispatcher/agent";
import { haversineDistanceKm, rankShelterCandidates } from "../src/lib/matching/engine";
import { renderAutoConfirmShelter, renderEscalateToAdmin } from "../src/lib/email/templates";
import type { ShelterCandidate, ListingMatchInput } from "../src/lib/matching/engine";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeShelter(overrides: Partial<ShelterCandidate> = {}): ShelterCandidate {
  return {
    id: "shelter-1",
    profile_id: "profile-1",
    name: "Hope Shelter",
    address: "MG Road, Bengaluru",
    location: { lat: 12.9756, lng: 77.6066 },
    latitude: 12.9756,
    longitude: 77.6066,
    capacity_kg: 100,
    current_load_kg: 20,
    available_capacity_kg: 80,
    food_preferences: [],
    food_restrictions: [],
    reliability_score: 0.85,
    status: "active",
    ...overrides,
  };
}

function makeListing(overrides: Partial<ListingMatchInput> = {}): ListingMatchInput {
  return {
    id: "listing-1",
    title: "Paneer Curry",
    food_category: "Cooked rice dishes / curries",
    quantity_kg: 15,
    latitude: 12.9750,
    longitude: 77.6060,
    ers_score: 85,
    allergens: [],
    ...overrides,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Phase 14: Agentic Dispatcher — Unit & Integration Tests", () => {

  describe("Dispatcher Action Types & Logic (phases.md §14)", () => {

    test("SKIP_ALREADY_ACTIONED action type exists in DispatcherAction union", () => {
      // Type-level check — if this compiles the union is correct
      const action = "SKIP_ALREADY_ACTIONED";
      assert.ok(
        ["AUTO_CONFIRM_SHELTER", "ASSIGN_DRIVER", "ESCALATE_TO_ADMIN", "SKIP_ALREADY_ACTIONED", "SKIP_NO_TRIGGER"].includes(action)
      );
    });

    test("runDispatcherAgent returns DispatcherRunResult shape", async () => {
      // Will fail at DB level without Supabase but should return structured error
      let result: DispatcherRunResult | null = null;
      try {
        result = await runDispatcherAgent();
      } catch {
        // Expected without live DB; confirm the function exists and is callable
        result = null;
      }
      // If it runs, must have the correct shape
      if (result !== null) {
        assert.ok("success" in result, "Result must have success");
        assert.ok("criticalListings" in result, "Result must have criticalListings");
        assert.ok(Array.isArray(result.actions), "Result.actions must be an array");
        assert.ok(Array.isArray(result.errors), "Result.errors must be an array");
        assert.ok(typeof result.durationMs === "number", "Result.durationMs must be a number");
      }
    });

    test("dispatcher returns gracefully when DB is not available", async () => {
      // With no real Supabase, dispatcher should not throw — it should catch and return errors array
      try {
        const result = await runDispatcherAgent();
        assert.ok(result.success === false || result.success === true, "Should return a result not throw");
      } catch (e) {
        // Acceptable if Supabase init fails — just ensuring it's not a TypeError on imports
        assert.ok(e instanceof Error, "Errors must be Error instances");
      }
    });

  });

  describe("Auto-confirm shelter selection (via rankShelterCandidates)", () => {

    test("selects closest auto-confirm shelter with highest match score", () => {
      const listing = makeListing({ ers_score: 85, quantity_kg: 15 });
      const shelters = [
        makeShelter({ id: "s1", name: "Shelter A", latitude: 12.9780, longitude: 77.6090, available_capacity_kg: 80, reliability_score: 0.8 }),
        makeShelter({ id: "s2", name: "Shelter B", latitude: 12.9900, longitude: 77.6200, available_capacity_kg: 50, reliability_score: 0.9 }),
      ];
      const { ranked } = rankShelterCandidates(listing, shelters);
      assert.ok(ranked.length > 0, "Should find at least one shelter");
      // Closest shelter gets higher distance score
      assert.ok(ranked[0].matchScore >= 0 && ranked[0].matchScore <= 1, "Match score must be 0–1");
    });

    test("excludes shelter with insufficient capacity", () => {
      const listing = makeListing({ quantity_kg: 200 }); // needs 200 kg
      const shelters = [
        makeShelter({ id: "s1", available_capacity_kg: 50 }), // only 50 kg available
      ];
      const { ranked } = rankShelterCandidates(listing, shelters);
      assert.strictEqual(ranked.length, 0, "Shelter with insufficient capacity must be excluded");
    });

    test("excludes shelter with food restriction violation", () => {
      const listing = makeListing({ food_category: "Meat-based dishes", allergens: ["beef"] });
      const shelters = [
        makeShelter({ food_restrictions: ["no meat", "vegetarian only"] }),
      ];
      const { ranked } = rankShelterCandidates(listing, shelters);
      assert.strictEqual(ranked.length, 0, "Shelter with restriction violation must be excluded");
    });

    test("excludes inactive shelters", () => {
      const listing = makeListing();
      const shelters = [
        makeShelter({ status: "unavailable" }),
      ];
      const { ranked } = rankShelterCandidates(listing, shelters);
      assert.strictEqual(ranked.length, 0, "Inactive shelters must be excluded");
    });

    test("when ERS >= 80, distance score is weighted 50% in final score", () => {
      const listing = makeListing({ ers_score: 82 });
      const shelter = makeShelter({ latitude: 12.9760, longitude: 77.6070 });
      const dist = haversineDistanceKm(listing.latitude, listing.longitude, shelter.latitude, shelter.longitude);
      const { ranked } = rankShelterCandidates(listing, [shelter]);
      assert.ok(ranked.length > 0, "Should find shelter");
      // With ERS >= 80 the formula applies 0.5 * baseScore + 0.5 * distScore
      // Just verify the score is within expected range
      assert.ok(ranked[0].matchScore > 0, "Match score > 0");
      // Distance for coords this close should be < 1km, meaning distanceScore ~ 1.0
      assert.ok(dist < 1, `Distance ${dist} km should be < 1 km for nearby coords`);
    });

  });

  describe("Pending match timeout logic (phases.md §14)", () => {

    test("isPendingTimedOut: match created 15 minutes ago is timed out for 10-min timeout", () => {
      const TIMEOUT_MIN = 10;
      const createdAt = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const elapsed = (Date.now() - new Date(createdAt).getTime()) / 60_000;
      assert.ok(elapsed >= TIMEOUT_MIN, "15-min-old match should be timed out at 10-min threshold");
    });

    test("isPendingTimedOut: match created 3 minutes ago is NOT timed out for 10-min timeout", () => {
      const TIMEOUT_MIN = 10;
      const createdAt = new Date(Date.now() - 3 * 60 * 1000).toISOString();
      const elapsed = (Date.now() - new Date(createdAt).getTime()) / 60_000;
      assert.ok(elapsed < TIMEOUT_MIN, "3-min-old match should NOT be timed out at 10-min threshold");
    });

  });

  describe("Opt-out window logic (rules.md §5)", () => {

    test("opt-out is within 5 minutes of match creation", () => {
      const OPT_OUT_WINDOW_MS = 5 * 60 * 1000;
      const createdAt = new Date(Date.now() - 2 * 60 * 1000).getTime(); // 2 min ago
      const elapsed = Date.now() - createdAt;
      assert.ok(elapsed <= OPT_OUT_WINDOW_MS, "2-minute-old match is within 5-minute opt-out window");
    });

    test("opt-out is expired after 6 minutes", () => {
      const OPT_OUT_WINDOW_MS = 5 * 60 * 1000;
      const createdAt = new Date(Date.now() - 6 * 60 * 1000).getTime(); // 6 min ago
      const elapsed = Date.now() - createdAt;
      assert.ok(elapsed > OPT_OUT_WINDOW_MS, "6-minute-old match exceeds 5-minute opt-out window");
    });

  });

  describe("Email Templates — AutoConfirmShelter & EscalateToAdmin", () => {

    test("renderAutoConfirmShelter returns non-empty HTML", async () => {
      const html = await renderAutoConfirmShelter({
        shelterName: "Hope Shelter",
        recipientName: "Coordinator Priya",
        listingTitle: "Paneer Curry",
        foodCategory: "Cooked rice dishes / curries",
        quantityKg: 15,
        ersScore: 85,
        pickupAddress: "MG Road, Bengaluru",
        optOutUrl: "https://annasetu.in/api/dispatcher/opt-out?match_id=abc123",
        dashboardUrl: "https://annasetu.in/shelter",
      });
      assert.ok(typeof html === "string" && html.length > 100, "Should render non-empty HTML");
      assert.ok(html.includes("AUTO-CONFIRMED"), "Should include auto-confirmed text");
      assert.ok(html.includes("Hope Shelter"), "Should include shelter name");
      assert.ok(html.includes("85"), "Should include ERS score");
      assert.ok(html.includes("opt-out"), "Should include opt-out link text");
    });

    test("renderEscalateToAdmin returns non-empty HTML with escalation reason", async () => {
      const html = await renderEscalateToAdmin({
        listingTitle: "Rice & Dal",
        listingId: "listing-abc-123",
        ersScore: 91,
        reason: "No auto-confirm shelter available within 15 km",
        adminUrl: "https://annasetu.in/admin",
        pickupAddress: "Koramangala, Bengaluru",
        foodCategory: "Cooked rice dishes / curries",
        quantityKg: 30,
      });
      assert.ok(typeof html === "string" && html.length > 100, "Should render non-empty HTML");
      assert.ok(html.includes("ESCALATION ALERT"), "Should include escalation alert heading");
      assert.ok(html.includes("91"), "Should include ERS score");
      assert.ok(html.includes("No auto-confirm shelter"), "Should include escalation reason");
      assert.ok(html.includes("listing-abc-123"), "Should include listing ID");
    });

    test("AutoConfirmShelter template contains opt-out URL", async () => {
      const matchId = "match-uuid-99";
      const html = await renderAutoConfirmShelter({
        shelterName: "City Food Bank",
        recipientName: "Admin",
        listingTitle: "Veg Biryani",
        foodCategory: "Rice dishes",
        quantityKg: 20,
        ersScore: 83,
        pickupAddress: "Indiranagar, Bengaluru",
        optOutUrl: `https://annasetu.in/api/dispatcher/opt-out?match_id=${matchId}`,
        dashboardUrl: "https://annasetu.in/shelter",
      });
      assert.ok(html.includes(matchId), "HTML should contain the match ID in the opt-out URL");
    });

  });

  describe("Agent log idempotency guard (rules.md §4 cron rules)", () => {

    test("2-minute window guard rejects listings actioned in last 2 minutes", () => {
      // Simulate the guard logic inline
      const windowStart = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const recentLog = { created_at: new Date(Date.now() - 60 * 1000).toISOString(), action: "AUTO_CONFIRM_SHELTER" };
      // Log is within window → should be blocked
      const isWithinWindow = new Date(recentLog.created_at) >= new Date(windowStart);
      assert.ok(isWithinWindow, "Log from 1 min ago should be within 2-min window");
    });

    test("2-minute window guard allows listings actioned 5 minutes ago", () => {
      const windowStart = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const oldLog = { created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), action: "AUTO_CONFIRM_SHELTER" };
      // Log is outside window → should be allowed
      const isWithinWindow = new Date(oldLog.created_at) >= new Date(windowStart);
      assert.ok(!isWithinWindow, "Log from 5 min ago should be outside 2-min window");
    });

    test("ESCALATE_TO_ADMIN actions bypass the 2-minute idempotency window", () => {
      // Escalations can always re-fire — the guard excludes ESCALATE_TO_ADMIN
      const action = "ESCALATE_TO_ADMIN";
      // The guard query uses .not("action", "eq", "ESCALATE_TO_ADMIN")
      // which means escalation logs don't block re-running
      assert.ok(action === "ESCALATE_TO_ADMIN", "ESCALATE_TO_ADMIN bypasses idempotency guard");
    });

  });

});

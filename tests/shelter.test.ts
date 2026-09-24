import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  renderMatchAccepted,
  renderCoordinatorInvite,
} from "../src/lib/email/templates";
import { isHardPreferenceViolated, calculatePreferenceScore } from "../src/lib/matching/engine";

describe("Phase 10: Shelter Dashboard & Match Accept/Decline — Unit & Integration Tests", () => {
  describe("Capacity Calculations & Fit Indicators (FR-DASH-S02)", () => {
    test("calculates available capacity and flags when listing exceeds available capacity", () => {
      const shelter = {
        capacity_kg: 100,
        current_load_kg: 85,
      };

      const availableCapacity = Math.max(0, shelter.capacity_kg - shelter.current_load_kg);
      assert.equal(availableCapacity, 15);

      const smallListing = { quantity_kg: 10 };
      const largeListing = { quantity_kg: 25 };

      assert.equal(availableCapacity >= smallListing.quantity_kg, true, "10kg fits within 15kg");
      assert.equal(availableCapacity >= largeListing.quantity_kg, false, "25kg exceeds 15kg");
    });

    test("handles full capacity (0 kg remaining)", () => {
      const fullShelter = {
        capacity_kg: 100,
        current_load_kg: 100,
      };

      const available = Math.max(0, fullShelter.capacity_kg - fullShelter.current_load_kg);
      assert.equal(available, 0);

      const listing = { quantity_kg: 5 };
      assert.equal(available >= listing.quantity_kg, false);
    });

    test("handles overflow or negative load gracefully", () => {
      const overloadedShelter = {
        capacity_kg: 100,
        current_load_kg: 110,
      };

      const available = Math.max(0, overloadedShelter.capacity_kg - overloadedShelter.current_load_kg);
      assert.equal(available, 0, "Available capacity should never be negative");
    });
  });

  describe("Food Preferences & Dietary Restrictions (FR-DASH-S04)", () => {
    test("calculates high preference score (1.0) when category is preferred", () => {
      const listing = { food_category: "Cooked rice dishes / curries" };
      const shelter = {
        food_preferences: ["Cooked rice dishes / curries", "Baked goods"],
      };

      const score = calculatePreferenceScore(listing, shelter);
      assert.equal(score, 1.0);
    });

    test("calculates compatible score (0.8) when category is not specifically preferred but not restricted", () => {
      const listing = { food_category: "Dairy products / sweets" };
      const shelter = {
        food_preferences: ["Cooked rice dishes / curries", "Baked goods"],
      };

      const score = calculatePreferenceScore(listing, shelter);
      assert.equal(score, 0.8);
    });

    test("strictly enforces hard dietary restrictions against listings", () => {
      const vegShelter = {
        food_restrictions: ["Pure Vegetarian Only (No Meat/Fish)"],
      };

      const meatListing = {
        food_category: "Cooked meat / fish dishes",
        allergens: [],
      };

      const vegListing = {
        food_category: "Cooked rice dishes / curries",
        allergens: [],
      };

      assert.equal(isHardPreferenceViolated(meatListing, vegShelter), true);
      assert.equal(isHardPreferenceViolated(vegListing, vegShelter), false);
    });

    test("strictly enforces allergen restrictions against listings", () => {
      const nutFreeShelter = {
        food_restrictions: ["Nut / Peanut Free"],
      };

      const nutListing = {
        food_category: "Baked goods / bread",
        allergens: ["Nuts / Peanuts"],
      };

      const safeListing = {
        food_category: "Baked goods / bread",
        allergens: ["None"],
      };

      assert.equal(isHardPreferenceViolated(nutListing, nutFreeShelter), true);
      assert.equal(isHardPreferenceViolated(safeListing, nutFreeShelter), false);
    });
  });

  describe("Match Decline Reason Validation (Phase 10 Requirement)", () => {
    test("validates that decline reason cannot be empty or whitespace", () => {
      const validateDeclineReason = (reason: unknown): boolean => {
        if (!reason || typeof reason !== "string") return false;
        return reason.trim().length > 0;
      };

      assert.equal(validateDeclineReason(""), false);
      assert.equal(validateDeclineReason("   "), false);
      assert.equal(validateDeclineReason(null), false);
      assert.equal(validateDeclineReason(undefined), false);
      assert.equal(validateDeclineReason("Shelter at maximum capacity"), true);
      assert.equal(validateDeclineReason("Custom maintenance reason"), true);
    });
  });

  describe("Shelter Coordinator Invite Link Generation", () => {
    test("formats secure coordinator invite URL with parameters", () => {
      const token = "mock-token-abc-123";
      const shelterId = "shelter-uuid-456";
      const role = "shelter_coordinator";
      const email = "coordinator@shelter.org";
      const appUrl = "http://localhost:3000";

      const inviteUrl = `${appUrl}/register?token=${token}&shelter=${shelterId}&role=${role}&email=${encodeURIComponent(email)}`;

      assert.match(inviteUrl, /token=mock-token-abc-123/);
      assert.match(inviteUrl, /shelter=shelter-uuid-456/);
      assert.match(inviteUrl, /role=shelter_coordinator/);
      assert.match(inviteUrl, /email=coordinator%40shelter\.org/);
    });
  });

  describe("Email Templates Rendering", () => {
    test("renders MatchAccepted email template with correct donor and shelter details", async () => {
      const html = await renderMatchAccepted({
        donorName: "Ravi Sharma",
        listingTitle: "Surplus Biryani Trays",
        shelterName: "Hope Community Shelter",
        shelterAddress: "123 Hope Way, Indiranagar, Bengaluru",
        quantityKg: 20,
        servings: 50,
        pickupAddress: "Spice Garden Restaurant, MG Road",
        pickupWindowStart: "2026-09-25T12:00:00Z",
        pickupWindowEnd: "2026-09-25T14:00:00Z",
        viewListingUrl: "http://localhost:3000/donor",
      });

      assert.ok(html.includes("DONATION MATCH ACCEPTED"), "Should include match accepted header");
      assert.ok(html.includes("Ravi Sharma"), "Should include donor name");
      assert.ok(html.includes("Hope Community Shelter"), "Should include shelter name");
      assert.ok(html.includes("Surplus Biryani Trays"), "Should include listing title");
      assert.ok(html.includes("20 kg"), "Should include quantity");
      assert.ok(html.includes("VIEW DONATION STATUS"), "Should include CTA");
    });

    test("renders CoordinatorInvite email template with invite link and organization details", async () => {
      const html = await renderCoordinatorInvite({
        inviteeEmail: "priya@hopeshelter.org",
        shelterName: "Hope Community Shelter",
        inviterName: "Anil Kumar",
        role: "Shelter Coordinator",
        inviteLink: "http://localhost:3000/register?token=test12345",
        expiresInDays: 7,
      });

      assert.ok(html.includes("INVITATION TO JOIN ANNASETU"), "Should include invitation header");
      assert.ok(html.includes("Hope Community Shelter"), "Should include shelter name");
      assert.ok(html.includes("Anil Kumar"), "Should include inviter name");
      assert.ok(html.includes("Shelter Coordinator"), "Should include assigned role");
      assert.ok(html.includes("token=test12345"), "Should include token in invite link");
    });
  });
});

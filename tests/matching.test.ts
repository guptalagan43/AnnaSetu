import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  haversineDistanceKm,
  isHardPreferenceViolated,
  calculatePreferenceScore,
  scoreShelterMatch,
  rankShelterCandidates,
  ShelterCandidate,
  ListingMatchInput,
} from "../src/lib/matching/engine";

describe("Phase 09: Geo-Matching Engine — Unit & Integration Tests", () => {
  describe("Spatial Distance Calculations (SRS §9.2)", () => {
    test("calculates accurate geographic distance between two known points", () => {
      // MG Road, Bengaluru (12.9756, 77.6066) to Indiranagar, Bengaluru (12.9784, 77.6408) is ~3.7 km
      const distance = haversineDistanceKm(12.9756, 77.6066, 12.9784, 77.6408);
      assert.ok(distance > 3.0 && distance < 4.5, `Distance was ${distance}`);
    });

    test("returns 0 distance for identical coordinates", () => {
      const distance = haversineDistanceKm(12.9716, 77.5946, 12.9716, 77.5946);
      assert.equal(distance, 0);
    });
  });

  describe("Hard Dietary & Allergen Restrictions (FR-MATCH-04)", () => {
    test("excludes meat listings for vegetarian-only shelters", () => {
      const meatListing = {
        food_category: "Cooked meat / fish",
        allergens: ["None"],
      };

      const vegShelter = {
        food_restrictions: ["Vegetarian only"],
      };

      assert.equal(isHardPreferenceViolated(meatListing, vegShelter), true);
    });

    test("allows vegetarian listings for vegetarian-only shelters", () => {
      const vegListing = {
        food_category: "Cooked rice dishes / curries",
        allergens: ["None"],
      };

      const vegShelter = {
        food_restrictions: ["Vegetarian only"],
      };

      assert.equal(isHardPreferenceViolated(vegListing, vegShelter), false);
    });

    test("excludes listings containing allergens restricted by shelter", () => {
      const peanutListing = {
        food_category: "Baked goods / bread",
        allergens: ["Nuts / Peanuts"],
      };

      const peanutFreeShelter = {
        food_restrictions: ["peanuts", "tree nuts"],
      };

      assert.equal(isHardPreferenceViolated(peanutListing, peanutFreeShelter), true);
    });
  });

  describe("Capacity Fit Exclusions (FR-MATCH-03)", () => {
    const sampleListing: ListingMatchInput = {
      id: "listing-1",
      title: "Surplus Rice Trays",
      food_category: "Cooked rice dishes / curries",
      quantity_kg: 50,
      latitude: 12.9716,
      longitude: 77.5946,
      ers_score: 50,
    };

    test("excludes shelter when listing quantity exceeds available capacity", () => {
      const fullShelter: ShelterCandidate = {
        id: "shelter-full",
        name: "Full Shelter",
        address: "123 Main St",
        location: null,
        latitude: 12.975,
        longitude: 77.598,
        capacity_kg: 100,
        current_load_kg: 80,
        available_capacity_kg: 20, // 20 kg < 50 kg
        status: "active",
      };

      const score = scoreShelterMatch(sampleListing, fullShelter, 1.2, 5);
      assert.equal(score, null, "Should exclude shelter with insufficient capacity");
    });

    test("includes and scores shelter when capacity is sufficient", () => {
      const availableShelter: ShelterCandidate = {
        id: "shelter-avail",
        name: "Hope Shelter",
        address: "456 Hope St",
        location: null,
        latitude: 12.975,
        longitude: 77.598,
        capacity_kg: 100,
        current_load_kg: 30,
        available_capacity_kg: 70, // 70 kg >= 50 kg
        status: "active",
        reliability_score: 0.85,
      };

      const scored = scoreShelterMatch(sampleListing, availableShelter, 1.2, 5);
      assert.notEqual(scored, null);
      assert.ok(scored!.matchScore > 0 && scored!.matchScore <= 1.0);
      assert.equal(scored!.shelter.id, "shelter-avail");
    });
  });

  describe("Match Scoring Formula (SRS §9.2)", () => {
    test("calculates score with proper weights (30% distance, 25% capacity, 25% pref, 10% rel, 10% urgency)", () => {
      const listing: ListingMatchInput = {
        id: "listing-2",
        title: "Mixed Dal & Roti",
        food_category: "Cooked rice dishes / curries",
        quantity_kg: 20,
        latitude: 12.97,
        longitude: 77.59,
        ers_score: 40,
      };

      const shelter: ShelterCandidate = {
        id: "shelter-perfect",
        name: "City Food Bank",
        address: "789 City Rd",
        location: null,
        latitude: 12.97,
        longitude: 77.59,
        capacity_kg: 100,
        current_load_kg: 0,
        available_capacity_kg: 100,
        status: "active",
        reliability_score: 0.9,
      };

      // Distance 0 km in 5 km radius -> distanceScore = 1.0
      // Capacity 100/100 -> capacityScore = 1.0
      // Pref compatible -> 1.0
      // Rel -> 0.9
      // ERS 40 -> urgency = 0.4
      // Expected = 0.3*1 + 0.25*1 + 0.25*1 + 0.1*0.9 + 0.1*0.4 = 0.3 + 0.25 + 0.25 + 0.09 + 0.04 = 0.93
      const scored = scoreShelterMatch(listing, shelter, 0, 5);
      assert.notEqual(scored, null);
      assert.equal(scored!.matchScore, 0.93);
    });

    test("prioritizes closest shelter when ERS is critical (>= 80)", () => {
      const criticalListing: ListingMatchInput = {
        id: "listing-urgent",
        title: "Urgent Hot Meal",
        food_category: "Cooked meat / fish",
        quantity_kg: 15,
        latitude: 12.97,
        longitude: 77.59,
        ers_score: 85, // Critical ERS!
      };

      const closeShelter: ShelterCandidate = {
        id: "shelter-close",
        name: "Close Shelter",
        address: "Nearby St",
        location: null,
        latitude: 12.971,
        longitude: 77.591, // 0.15 km away
        capacity_kg: 50,
        current_load_kg: 10,
        available_capacity_kg: 40,
        status: "active",
        reliability_score: 0.7,
      };

      const farShelter: ShelterCandidate = {
        id: "shelter-far",
        name: "Far Shelter",
        address: "Far St",
        location: null,
        latitude: 12.99,
        longitude: 77.62, // ~4.5 km away
        capacity_kg: 1000,
        current_load_kg: 0,
        available_capacity_kg: 1000,
        status: "active",
        reliability_score: 0.95,
      };

      const distClose = haversineDistanceKm(criticalListing.latitude, criticalListing.longitude, closeShelter.latitude, closeShelter.longitude);
      const distFar = haversineDistanceKm(criticalListing.latitude, criticalListing.longitude, farShelter.latitude, farShelter.longitude);

      const scoreClose = scoreShelterMatch(criticalListing, closeShelter, distClose, 5);
      const scoreFar = scoreShelterMatch(criticalListing, farShelter, distFar, 5);

      assert.ok(scoreClose!.matchScore > scoreFar!.matchScore, "Closest shelter must score higher under critical ERS");
    });
  });

  describe("Matching Cascade & Radius Expansion (SRS §9.3)", () => {
    test("matches within 5km if candidate exists", () => {
      const listing: ListingMatchInput = {
        id: "listing-cascade-1",
        title: "Fresh Fruits",
        food_category: "Fresh produce",
        quantity_kg: 10,
        latitude: 12.97,
        longitude: 77.59,
      };

      const nearShelter: ShelterCandidate = {
        id: "s-near",
        name: "Near Shelter",
        address: "2 km away",
        location: null,
        latitude: 12.98,
        longitude: 77.60, // ~1.5 km
        capacity_kg: 50,
        current_load_kg: 0,
        available_capacity_kg: 50,
        status: "active",
      };

      const { ranked, searchRadiusKm } = rankShelterCandidates(listing, [nearShelter]);
      assert.equal(searchRadiusKm, 5);
      assert.equal(ranked.length, 1);
      assert.equal(ranked[0].shelter.id, "s-near");
    });

    test("expands radius to 10km if no candidate within 5km", () => {
      const listing: ListingMatchInput = {
        id: "listing-cascade-2",
        title: "Fresh Fruits",
        food_category: "Fresh produce",
        quantity_kg: 10,
        latitude: 12.97,
        longitude: 77.59,
      };

      // Shelter at ~7.5 km
      const midShelter: ShelterCandidate = {
        id: "s-mid",
        name: "Mid Shelter",
        address: "7.5 km away",
        location: null,
        latitude: 13.03,
        longitude: 77.62,
        capacity_kg: 50,
        current_load_kg: 0,
        available_capacity_kg: 50,
        status: "active",
      };

      const { ranked, searchRadiusKm } = rankShelterCandidates(listing, [midShelter]);
      assert.equal(searchRadiusKm, 10);
      assert.equal(ranked.length, 1);
      assert.equal(ranked[0].shelter.id, "s-mid");
    });

    test("excludes previously declined shelter and picks next candidate (FR-MATCH-05)", () => {
      const listing: ListingMatchInput = {
        id: "listing-cascade-3",
        title: "Rice Dishes",
        food_category: "Cooked rice dishes / curries",
        quantity_kg: 15,
        latitude: 12.97,
        longitude: 77.59,
      };

      const shelter1: ShelterCandidate = {
        id: "s-declined",
        name: "Declined Shelter",
        address: "1 km away",
        location: null,
        latitude: 12.975,
        longitude: 77.595,
        capacity_kg: 50,
        current_load_kg: 0,
        available_capacity_kg: 50,
        status: "active",
        reliability_score: 0.95,
      };

      const shelter2: ShelterCandidate = {
        id: "s-backup",
        name: "Backup Shelter",
        address: "2 km away",
        location: null,
        latitude: 12.98,
        longitude: 77.60,
        capacity_kg: 50,
        current_load_kg: 0,
        available_capacity_kg: 50,
        status: "active",
        reliability_score: 0.85,
      };

      // Exclude shelter1 (previously declined)
      const { ranked } = rankShelterCandidates(listing, [shelter1, shelter2], ["s-declined"]);
      assert.equal(ranked.length, 1);
      assert.equal(ranked[0].shelter.id, "s-backup");
    });

    test("returns empty list gracefully if all shelters exceed 15km", () => {
      const listing: ListingMatchInput = {
        id: "listing-cascade-4",
        title: "Bread",
        food_category: "Baked goods / bread",
        quantity_kg: 5,
        latitude: 12.97,
        longitude: 77.59,
      };

      // Very far shelter (>25 km)
      const farShelter: ShelterCandidate = {
        id: "s-super-far",
        name: "Super Far Shelter",
        address: "30 km away",
        location: null,
        latitude: 13.20,
        longitude: 77.80,
        capacity_kg: 100,
        current_load_kg: 0,
        available_capacity_kg: 100,
        status: "active",
      };

      const { ranked, searchRadiusKm } = rankShelterCandidates(listing, [farShelter]);
      assert.equal(ranked.length, 0);
      assert.equal(searchRadiusKm, 15);
    });
  });
});

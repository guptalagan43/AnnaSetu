import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { calculateERS, getCategoryConfig, FOOD_CATEGORY_CONFIGS } from "../src/lib/ers/calculator";
import { cacheListingERS, getCachedListingERS } from "../src/lib/ers/cache";
import { parseCoordinates } from "../src/lib/ers/coordinates";
import { renderERSAlert } from "../src/lib/email/templates";

describe("Phase 08: ERS Engine — Unit & Integration Tests", () => {
  describe("Category Configurations & Safe Windows (SRS §8.2)", () => {
    test("all standard food categories are defined with correct windows and multipliers", () => {
      assert.equal(getCategoryConfig("Cooked meat / fish").maxSafeWindowHours, 2);
      assert.equal(getCategoryConfig("Cooked meat / fish").multiplier, 2.0);

      assert.equal(getCategoryConfig("Dairy-based dishes").maxSafeWindowHours, 3);
      assert.equal(getCategoryConfig("Dairy-based dishes").multiplier, 1.8);

      assert.equal(getCategoryConfig("Cooked rice dishes / curries").maxSafeWindowHours, 4);
      assert.equal(getCategoryConfig("Cooked rice dishes / curries").multiplier, 1.5);

      assert.equal(getCategoryConfig("Cooked pasta / noodles").maxSafeWindowHours, 4);
      assert.equal(getCategoryConfig("Cooked pasta / noodles").multiplier, 1.4);

      assert.equal(getCategoryConfig("Soups / broths").maxSafeWindowHours, 4);
      assert.equal(getCategoryConfig("Soups / broths").multiplier, 1.4);

      assert.equal(getCategoryConfig("Baked goods / bread").maxSafeWindowHours, 8);
      assert.equal(getCategoryConfig("Baked goods / bread").multiplier, 1.0);

      assert.equal(getCategoryConfig("Fresh produce").maxSafeWindowHours, 12);
      assert.equal(getCategoryConfig("Fresh produce").multiplier, 0.8);

      assert.equal(getCategoryConfig("Packaged / sealed items").maxSafeWindowHours, 24);
      assert.equal(getCategoryConfig("Packaged / sealed items").multiplier, 0.5);

      assert.equal(getCategoryConfig("Beverages (opened)").maxSafeWindowHours, 6);
      assert.equal(getCategoryConfig("Beverages (opened)").multiplier, 0.9);
    });

    test("snake_case category aliases resolve correctly", () => {
      assert.equal(getCategoryConfig("cooked_meat_fish").maxSafeWindowHours, 2);
      assert.equal(getCategoryConfig("dairy_dish").multiplier, 1.8);
      assert.equal(getCategoryConfig("cooked_rice_curry").multiplier, 1.5);
    });

    test("unknown categories fall back to standard 4h window and 1.0 multiplier", () => {
      const fallback = getCategoryConfig("Mysterious Food Type");
      assert.equal(fallback.maxSafeWindowHours, 4);
      assert.equal(fallback.multiplier, 1.0);
    });
  });

  describe("ERS Formula Calculations (SRS §8.1)", () => {
    test("expired food immediately returns score 100, emergency status and auto-expired flag", () => {
      const pastTime = new Date(Date.now() - 30 * 60 * 1000); // 30 mins ago
      const result = calculateERS({
        foodCategory: "Cooked meat / fish",
        expiryTime: pastTime,
      });

      assert.equal(result.score, 100);
      assert.equal(result.urgency, "emergency");
      assert.equal(result.colorLabel, "Expiring");
      assert.equal(result.isAutoExpired, true);
      assert.equal(result.shouldEscalate, true);
    });

    test("fresh food with full safe window remaining has baseRisk 0 and low ERS", () => {
      const now = new Date("2026-09-24T12:00:00Z");
      const expiry = new Date("2026-09-24T16:00:00Z"); // 4 hours later for 4h safe window
      const result = calculateERS({
        foodCategory: "Cooked rice dishes / curries",
        currentTime: now,
        expiryTime: expiry,
        isRefrigerated: true, // -15 adjustment
      });

      assert.equal(result.baseRisk, 0);
      // baseRisk * 1.5 + (-15) = -15 -> clamped to 0
      assert.equal(result.score, 0);
      assert.equal(result.urgency, "safe");
      assert.equal(result.shouldEscalate, false);
      assert.equal(result.isAutoExpired, false);
    });

    test("calculates correct baseRisk and category multiplier mid-window", () => {
      const now = new Date("2026-09-24T12:00:00Z");
      // 1 hour remaining for cooked meat (safe window 2h) -> (1 - 1/2) * 100 = 50 baseRisk
      const expiry = new Date("2026-09-24T13:00:00Z");
      const result = calculateERS({
        foodCategory: "Cooked meat / fish",
        currentTime: now,
        expiryTime: expiry,
        isRefrigerated: false, // +10 adjustment
      });

      assert.equal(result.baseRisk, 50);
      assert.equal(result.categoryMultiplier, 2.0);
      // rawScore = 50 * 2.0 + 10 = 110 -> clamped to 100
      assert.equal(result.score, 100);
      assert.equal(result.isAutoExpired, true);
    });
  });

  describe("Adjustment Factors (SRS §8.3)", () => {
    const baseNow = new Date("2026-09-24T12:00:00Z");
    const baseExpiry = new Date("2026-09-24T15:00:00Z"); // 3 hours left on 8h baked goods -> baseRisk = (1 - 3/8)*100 = 62.5

    test("refrigeration penalty / discount applies properly", () => {
      // Unrefrigerated / unspecified: +10
      const unrefrigerated = calculateERS({
        foodCategory: "Baked goods / bread",
        currentTime: baseNow,
        expiryTime: baseExpiry,
        isRefrigerated: null,
      });
      assert.equal(unrefrigerated.adjustments.refrigeration, 10);

      // Refrigerated: -15
      const refrigerated = calculateERS({
        foodCategory: "Baked goods / bread",
        currentTime: baseNow,
        expiryTime: baseExpiry,
        isRefrigerated: true,
      });
      assert.equal(refrigerated.adjustments.refrigeration, -15);
      assert.equal(unrefrigerated.score - refrigerated.score, 25);
    });

    test("temperature penalties apply: +12 for >35°C, +20 for >40°C", () => {
      const normalTemp = calculateERS({
        foodCategory: "Fresh produce",
        currentTime: baseNow,
        expiryTime: baseExpiry,
        outdoorTempCelsius: 30,
        isRefrigerated: true,
      });
      assert.equal(normalTemp.adjustments.temperature, 0);

      const hotTemp = calculateERS({
        foodCategory: "Fresh produce",
        currentTime: baseNow,
        expiryTime: baseExpiry,
        outdoorTempCelsius: 37,
        isRefrigerated: true,
      });
      assert.equal(hotTemp.adjustments.temperature, 12);

      const severeTemp = calculateERS({
        foodCategory: "Fresh produce",
        currentTime: baseNow,
        expiryTime: baseExpiry,
        outdoorTempCelsius: 43,
        isRefrigerated: true,
      });
      assert.equal(severeTemp.adjustments.temperature, 20);
    });

    test("status discounts: -10 for matched, -20 for in_transit/driver_assigned", () => {
      const listed = calculateERS({
        foodCategory: "Cooked pasta / noodles",
        currentTime: baseNow,
        expiryTime: baseExpiry,
        status: "listed",
        isRefrigerated: true,
      });

      const matched = calculateERS({
        foodCategory: "Cooked pasta / noodles",
        currentTime: baseNow,
        expiryTime: baseExpiry,
        status: "matched",
        isRefrigerated: true,
      });
      assert.equal(matched.adjustments.status, -10);

      const inTransit = calculateERS({
        foodCategory: "Cooked pasta / noodles",
        currentTime: baseNow,
        expiryTime: baseExpiry,
        status: "in_transit",
        isRefrigerated: true,
      });
      assert.equal(inTransit.adjustments.status, -20);
      assert.equal(listed.score - inTransit.score, 20);
    });

    test("donor reputation discount: -5 if > 10 prior donations", () => {
      const newDonor = calculateERS({
        foodCategory: "Soups / broths",
        currentTime: baseNow,
        expiryTime: baseExpiry,
        donorSuccessfulDonations: 2,
        isRefrigerated: true,
      });
      assert.equal(newDonor.adjustments.donorReputation, 0);

      const veteranDonor = calculateERS({
        foodCategory: "Soups / broths",
        currentTime: baseNow,
        expiryTime: baseExpiry,
        donorSuccessfulDonations: 15,
        isRefrigerated: true,
      });
      assert.equal(veteranDonor.adjustments.donorReputation, -5);
      assert.equal(newDonor.score - veteranDonor.score, 5);
    });
  });

  describe("Thresholds & Action Triggers (SRS §8.4 & §8.5)", () => {
    test("escalation flag triggers at score >= 81", () => {
      const now = new Date("2026-09-24T12:00:00Z");
      // 30 min left on 4h rice dish: baseRisk = (1 - 0.5/4)*100 = 87.5. Multiplier 1.5 -> raw 131 -> 100
      const criticalResult = calculateERS({
        foodCategory: "Cooked rice dishes / curries",
        currentTime: now,
        expiryTime: new Date("2026-09-24T12:30:00Z"),
      });
      assert.equal(criticalResult.shouldEscalate, true);
      assert.equal(criticalResult.urgency === "critical" || criticalResult.urgency === "emergency", true);
    });

    test("auto-expiry flag triggers at score >= 96", () => {
      const now = new Date("2026-09-24T12:00:00Z");
      const expiringResult = calculateERS({
        foodCategory: "Dairy-based dishes",
        currentTime: now,
        expiryTime: new Date("2026-09-24T12:10:00Z"), // 10 min left
      });
      assert.equal(expiringResult.isAutoExpired, true);
      assert.equal(expiringResult.colorLabel, "Expiring");
    });
  });

  describe("Coordinates Parser", () => {
    test("parses PostGIS WKT POINT format", () => {
      const coords = parseCoordinates("SRID=4326;POINT(77.5946 12.9716)");
      assert.notEqual(coords, null);
      assert.equal(coords?.lat, 12.9716);
      assert.equal(coords?.lng, 77.5946);
    });

    test("parses GeoJSON Point format", () => {
      const coords = parseCoordinates({ type: "Point", coordinates: [77.5946, 12.9716] });
      assert.notEqual(coords, null);
      assert.equal(coords?.lat, 12.9716);
      assert.equal(coords?.lng, 77.5946);
    });

    test("handles null or invalid coordinates gracefully", () => {
      assert.equal(parseCoordinates(null), null);
      assert.equal(parseCoordinates("INVALID_POINT"), null);
    });
  });

  describe("Redis Cache Layer (SRS §8.5 & Phase 08)", () => {
    test("caches and retrieves listing ERS score with TTL", async () => {
      const testListingId = "test-listing-uuid-12345";
      const testScore = 78;

      await cacheListingERS(testListingId, testScore, 900);
      const retrieved = await getCachedListingERS(testListingId);

      assert.equal(retrieved, testScore);
    });
  });

  describe("Escalation Email Template Rendering", () => {
    test("renders ERSAlert email HTML with score and details", async () => {
      const html = await renderERSAlert({
        donorName: "Ananya Patel",
        listingTitle: "Fresh Vegetable Curry",
        ersScore: 84,
        foodCategory: "Cooked rice dishes / curries",
        quantityKg: 20,
        servings: 50,
        expiryTime: new Date(Date.now() + 40 * 60 * 1000).toISOString(),
        actionUrl: "https://annasetu.in/donor",
        recipientType: "donor",
      });

      assert.match(html, /84/);
      assert.match(html, /Fresh Vegetable Curry/);
      assert.match(html, /EXPIRY RISK SCORE/);
      assert.match(html, /Ananya Patel/);
    });
  });
});

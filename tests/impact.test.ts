import { test, describe } from "node:test";
import assert from "node:assert";
import {
  EPA_WARM_CO2E_FACTOR,
  calculateCO2e,
  calculateMeals,
  formatRelativeTime,
  normalizeHotspots,
  type ImpactTotals,
  type RecentActivityItem,
  type HotspotPoint,
} from "../src/lib/impact/calculator";

describe("Phase 17: Public Impact Dashboard — Unit & Integration Tests", () => {
  describe("EPA WARM CO₂e Methodology (phases.md §17 / SRS §17.4)", () => {
    test("conversion factor is exactly 2.5 (1 kg food rescued = 2.5 kg CO2e avoided)", () => {
      assert.strictEqual(EPA_WARM_CO2E_FACTOR, 2.5);
    });

    test("calculates CO2e avoided correctly for positive weights", () => {
      assert.strictEqual(calculateCO2e(10), 25.0);
      assert.strictEqual(calculateCO2e(100), 250.0);
      assert.strictEqual(calculateCO2e(19328), 48320.0);
      assert.strictEqual(calculateCO2e(2.35), 5.88);
    });

    test("returns 0 for zero, negative or invalid weights", () => {
      assert.strictEqual(calculateCO2e(0), 0);
      assert.strictEqual(calculateCO2e(-15), 0);
      // @ts-expect-error test invalid type
      assert.strictEqual(calculateCO2e(null), 0);
      assert.strictEqual(calculateCO2e(NaN), 0);
    });
  });

  describe("Meal Calculation Logic (SRS §8.1 / phases.md §17)", () => {
    test("calculates meals using default factor of 2.5 meals/kg when servings not provided", () => {
      assert.strictEqual(calculateMeals(10), 25);
      assert.strictEqual(calculateMeals(20), 50);
      assert.strictEqual(calculateMeals(0), 0);
    });

    test("preserves explicit servings over weight estimate when provided and positive", () => {
      assert.strictEqual(calculateMeals(10, 35), 35);
      assert.strictEqual(calculateMeals(50, 200), 200);
    });

    test("falls back to weight factor when servings is null, 0 or negative", () => {
      assert.strictEqual(calculateMeals(10, null), 25);
      assert.strictEqual(calculateMeals(10, 0), 25);
      assert.strictEqual(calculateMeals(10, -5), 25);
    });
  });

  describe("Relative Time Formatting (phases.md §17 Ticker)", () => {
    test("returns 'Just now' for timestamps within 60 seconds", () => {
      const nowIso = new Date(Date.now() - 10 * 1000).toISOString();
      assert.strictEqual(formatRelativeTime(nowIso), "Just now");
    });

    test("returns minutes ago for timestamps under 1 hour", () => {
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      assert.strictEqual(formatRelativeTime(tenMinsAgo), "10m ago");
    });

    test("returns hours ago for timestamps under 24 hours", () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      assert.strictEqual(formatRelativeTime(twoHoursAgo), "2h ago");
    });

    test("returns days ago for timestamps under 30 days", () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      assert.strictEqual(formatRelativeTime(threeDaysAgo), "3d ago");
    });

    test("handles invalid date strings gracefully without throwing", () => {
      assert.strictEqual(formatRelativeTime("invalid-date"), "Recently");
    });
  });

  describe("Geospatial Hotspot Normalization (phases.md §17 Heatmap)", () => {
    test("normalizes empty raw points to empty array", () => {
      assert.deepStrictEqual(normalizeHotspots([]), []);
      // @ts-expect-error testing invalid input
      assert.deepStrictEqual(normalizeHotspots(null), []);
    });

    test("filters out invalid coordinates outside valid lat/lng ranges", () => {
      const raw: any[] = [
        { lat: 12.97, lng: 77.59, weight_kg: 50 }, // valid
        { lat: 95.0, lng: 77.59, weight_kg: 50 }, // invalid lat > 90
        { lat: 12.97, lng: 200.0, weight_kg: 50 }, // invalid lng > 180
        { weight_kg: 50 },
      ];
      const normalized = normalizeHotspots(raw);
      assert.strictEqual(normalized.length, 1);
      assert.strictEqual(normalized[0].lat, 12.97);
      assert.strictEqual(normalized[0].lng, 77.59);
    });

    test("scales intensity between 0.3 and 1.0 according to relative weight", () => {
      const raw = [
        { lat: 12.97, lng: 77.59, weight_kg: 100 }, // max => 1.0
        { lat: 12.93, lng: 77.62, weight_kg: 50 }, // 50% => 0.3 + 0.7 * 0.5 = 0.65
        { lat: 12.98, lng: 77.64, weight_kg: 0 }, // 0% => 0.3
      ];
      const normalized = normalizeHotspots(raw);
      assert.strictEqual(normalized.length, 3);
      assert.strictEqual(normalized[0].intensity, 1.0);
      assert.strictEqual(normalized[1].intensity, 0.65);
      assert.strictEqual(normalized[2].intensity, 0.3);
    });

    test("populates meals correctly for each hotspot point", () => {
      const raw = [{ lat: 12.97, lng: 77.59, weight_kg: 40 }];
      const normalized = normalizeHotspots(raw);
      assert.strictEqual(normalized[0].meals, 100); // 40kg * 2.5 = 100 meals
      assert.strictEqual(normalized[0].weight_kg, 40);
    });
  });

  describe("Impact Dashboard Data Contract (phases.md §17 /api/impact)", () => {
    test("ImpactTotals contract contains all required counter metrics", () => {
      const sampleTotals: ImpactTotals = {
        meals_rescued: 48320,
        weight_kg: 19328,
        co2e_avoided_kg: 48320,
        active_donors: 142,
        active_shelters: 38,
        volunteer_drivers: 89,
      };

      assert.strictEqual(typeof sampleTotals.meals_rescued, "number");
      assert.strictEqual(typeof sampleTotals.weight_kg, "number");
      assert.strictEqual(typeof sampleTotals.co2e_avoided_kg, "number");
      assert.strictEqual(typeof sampleTotals.active_donors, "number");
      assert.strictEqual(typeof sampleTotals.active_shelters, "number");
      assert.strictEqual(typeof sampleTotals.volunteer_drivers, "number");
    });

    test("RecentActivityItem contract includes donor, shelter, meals and relative time", () => {
      const item: RecentActivityItem = {
        id: "act-test",
        donor_name: "MG Road Dhaba",
        shelter_name: "Hope Shelter",
        food_title: "Dal Makhani",
        meals: 50,
        weight_kg: 20,
        delivered_at: new Date().toISOString(),
        time_ago: "5m ago",
      };

      assert.ok(item.donor_name);
      assert.ok(item.shelter_name);
      assert.ok(item.meals > 0);
      assert.ok(item.time_ago);
    });

    test("HotspotPoint contract matches Leaflet HeatLayer input format", () => {
      const hotspot: HotspotPoint = {
        lat: 12.9716,
        lng: 77.5946,
        intensity: 0.95,
        meals: 8500,
        weight_kg: 3400,
        location_name: "MG Road Central",
      };

      // Leaflet.heat expects [lat, lng, intensity]
      const heatTuple: [number, number, number] = [hotspot.lat, hotspot.lng, hotspot.intensity];
      assert.strictEqual(heatTuple[0], 12.9716);
      assert.strictEqual(heatTuple[1], 77.5946);
      assert.ok(heatTuple[2] >= 0 && heatTuple[2] <= 1);
    });
  });
});

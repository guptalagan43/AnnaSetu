import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  getDistanceMatrix,
  getRouteGeometry,
  optimizeRoute,
  RouteStop,
} from "../src/lib/routing/osrm";

describe("Phase 12: Route Optimization (OSRM + Multi-Stop) — Unit & Integration Tests", () => {
  const driverStart = { latitude: 12.9716, longitude: 77.5946 }; // Bangalore Central

  describe("Distance Matrix & Fallback Calculations (Phase 12 Task 1)", () => {
    test("handles empty coordinates without error", async () => {
      const result = await getDistanceMatrix([]);
      assert.deepEqual(result.distances, []);
      assert.deepEqual(result.durations, []);
    });

    test("computes symmetrical zero-diagonal distance and duration matrix", async () => {
      const coords = [
        { latitude: 12.9716, longitude: 77.5946 }, // MG Road
        { latitude: 12.9784, longitude: 77.6408 }, // Indiranagar
        { latitude: 12.9352, longitude: 77.6245 }, // Koramangala
      ];

      const { distances, durations } = await getDistanceMatrix(coords);

      assert.equal(distances.length, 3);
      assert.equal(durations.length, 3);

      // Distance from a point to itself must be 0
      assert.equal(distances[0][0], 0);
      assert.equal(distances[1][1], 0);
      assert.equal(distances[2][2], 0);

      // Distance between distinct points must be positive
      assert.ok(distances[0][1] > 0, "Distance from MG Road to Indiranagar should be positive");
      assert.ok(durations[0][1] > 0, "Duration from MG Road to Indiranagar should be positive");
    });
  });

  describe("Route Geometry Generation (Phase 12 Task 1)", () => {
    test("returns single coordinate or waypoint array for trivial routes", async () => {
      const coords = [{ latitude: 12.9716, longitude: 77.5946 }];
      const geometry = await getRouteGeometry(coords);
      assert.equal(geometry.length, 1);
      assert.deepEqual(geometry[0], [12.9716, 77.5946]);
    });

    test("returns polyline with start and end coordinates", async () => {
      const coords = [
        { latitude: 12.9716, longitude: 77.5946 },
        { latitude: 12.9784, longitude: 77.6408 },
      ];
      const geometry = await getRouteGeometry(coords);
      assert.ok(geometry.length >= 2, "Polyline should contain at least start and end points");
      assert.ok(
        Math.abs(geometry[0][0] - 12.9716) < 0.01,
        "Start latitude should be within 0.01 degrees (snapped to road)"
      );
      assert.ok(
        Math.abs(geometry[0][1] - 77.5946) < 0.01,
        "Start longitude should be within 0.01 degrees (snapped to road)"
      );
    });
  });

  describe("Nearest-Neighbor Optimization & Constraints (FR-ROUTE-04 & FR-ROUTE-05)", () => {
    test("handles empty stops list gracefully", async () => {
      const result = await optimizeRoute([], driverStart);
      assert.equal(result.stops.length, 0);
      assert.equal(result.total_distance_km, 0);
      assert.equal(result.total_duration_minutes, 0);
      assert.equal(result.route_geometry.length, 1);
    });

    test("enforces pickup-before-delivery hard constraint (FR-ROUTE-04)", async () => {
      // Setup a pickup and its corresponding delivery
      const stops: RouteStop[] = [
        {
          id: "delivery-1",
          type: "delivery",
          name: "Shelter Delivery",
          address: "8th Main, Sampangiram Nagar",
          latitude: 12.972, // Very close to driver start
          longitude: 77.595,
          associated_pickup_id: "pickup-1",
        },
        {
          id: "pickup-1",
          type: "pickup",
          name: "Donor Bakery Pickup",
          address: "100ft Rd, Indiranagar",
          latitude: 12.9784, // Farther away from driver start
          longitude: 77.6408,
          ers_score: 40,
        },
      ];

      const result = await optimizeRoute(stops, driverStart);

      // Even though delivery-1 is physically closer to driver start,
      // pickup-1 MUST be visited first because delivery-1 cannot occur before pickup-1!
      assert.equal(result.stops.length, 2);
      assert.equal(result.stops[0].id, "pickup-1", "Pickup MUST precede delivery");
      assert.equal(result.stops[0].stop_number, 1);
      assert.equal(result.stops[1].id, "delivery-1", "Delivery MUST come after pickup");
      assert.equal(result.stops[1].stop_number, 2);
    });

    test("prioritizes high-urgency pickups with ERS >= 70 first (FR-ROUTE-05 / SRS §12.3)", async () => {
      // Two pickups:
      // Pickup A: ERS 30 (non-urgent), located closer to driver
      // Pickup B: ERS 85 (critical urgency), located slightly farther
      const stops: RouteStop[] = [
        {
          id: "pickup-low-ers",
          type: "pickup",
          name: "Dry Rations (Low ERS)",
          address: "Cubbon Park Road",
          latitude: 12.974,
          longitude: 77.596,
          ers_score: 30,
        },
        {
          id: "pickup-high-ers",
          type: "pickup",
          name: "Hot Cooked Meals (High ERS)",
          address: "Koramangala 5th Block",
          latitude: 12.9352,
          longitude: 77.6245,
          ers_score: 85,
        },
      ];

      const result = await optimizeRoute(stops, driverStart);

      assert.equal(result.stops.length, 2);
      assert.equal(
        result.stops[0].id,
        "pickup-high-ers",
        "High ERS (>= 70) pickup MUST be prioritized over closer low-ERS pickup"
      );
      assert.equal(result.stops[1].id, "pickup-low-ers");
    });

    test("calculates cumulative distance and ETAs with 10-minute stop buffer", async () => {
      const stops: RouteStop[] = [
        {
          id: "pickup-1",
          type: "pickup",
          name: "Pickup 1",
          address: "Indiranagar",
          latitude: 12.9784,
          longitude: 77.6408,
          ers_score: 60,
        },
        {
          id: "delivery-1",
          type: "delivery",
          name: "Delivery 1",
          address: "Ulsoor",
          latitude: 12.9817,
          longitude: 77.6212,
          associated_pickup_id: "pickup-1",
        },
      ];

      const result = await optimizeRoute(stops, driverStart);

      assert.equal(result.stops.length, 2);
      assert.ok(result.total_distance_km > 0, "Total distance must be positive");
      assert.ok(result.total_duration_minutes > 0, "Total duration must be positive");

      // Verify stop 2 ETA is greater than stop 1 ETA
      const stop1Eta = result.stops[0].eta_minutes ?? 0;
      const stop2Eta = result.stops[1].eta_minutes ?? 0;

      assert.ok(
        stop2Eta >= stop1Eta + 10,
        "Stop 2 ETA must include travel time PLUS at least 10 min handover buffer at Stop 1"
      );

      // Verify formatted time string is present
      assert.ok(result.stops[0].eta_time, "eta_time must be formatted");
      assert.ok(result.stops[1].eta_time, "eta_time must be formatted");
    });

    test("handles in_transit pickups where only delivery is pending", async () => {
      // Driver has already picked up listing 101, so only delivery stop is remaining
      const stops: RouteStop[] = [
        {
          id: "delivery-101",
          type: "delivery",
          name: "Asha Kiran Shelter Delivery",
          address: "Sampangiram Nagar",
          latitude: 12.9648,
          longitude: 77.5891,
          status: "in_transit",
        },
      ];

      const result = await optimizeRoute(stops, driverStart);

      assert.equal(result.stops.length, 1);
      assert.equal(result.stops[0].id, "delivery-101");
      assert.equal(result.stops[0].stop_number, 1);
      assert.ok((result.stops[0].eta_minutes ?? 0) > 0);
    });
  });

  describe("Google Maps Navigation Deep-Link Formatting (Phase 12 Task 6)", () => {
    test("encodes special characters and addresses into valid Google Maps URL", () => {
      const formatNavigateUrl = (address: string) =>
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

      const testAddress = "37/1, 2nd Floor, M.G. Road & Brigade Junction, Bangalore #560001";
      const url = formatNavigateUrl(testAddress);

      assert.ok(url.startsWith("https://www.google.com/maps/dir/?api=1&destination="));
      assert.ok(!url.includes(" "), "URL must not contain raw spaces");
      assert.ok(url.includes("37%2F1"), "URL must encode slashes");
      assert.ok(url.includes("%26"), "URL must encode ampersands");
    });
  });
});

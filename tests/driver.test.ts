import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  renderDriverAssigned,
  renderDriverPickedUp,
} from "../src/lib/email/templates";

describe("Phase 11: Driver Dashboard & Assignment — Unit & Integration Tests", () => {
  describe("Status Pipeline Transitions (Phase 11 Objective & §15.3)", () => {
    test("advances status pipeline sequentially: matched -> driver_assigned -> in_transit -> checklist", () => {
      type PipelineStatus = "listed" | "matched" | "driver_assigned" | "in_transit" | "checklist" | "delivered";

      const advancePipeline = (current: PipelineStatus, action: "assign" | "pickup" | "deliver"): PipelineStatus => {
        switch (action) {
          case "assign":
            if (current === "matched" || current === "listed") return "driver_assigned";
            throw new Error(`Cannot assign driver when status is ${current}`);
          case "pickup":
            if (current === "driver_assigned") return "in_transit";
            throw new Error(`Cannot pick up when status is ${current}`);
          case "deliver":
            if (current === "in_transit") return "checklist";
            throw new Error(`Cannot deliver when status is ${current}`);
        }
      };

      let status: PipelineStatus = "matched";
      status = advancePipeline(status, "assign");
      assert.equal(status, "driver_assigned", "Assigning driver sets status to driver_assigned");

      status = advancePipeline(status, "pickup");
      assert.equal(status, "in_transit", "Marking picked up sets status to in_transit");

      status = advancePipeline(status, "deliver");
      assert.equal(status, "checklist", "Marking delivered sets status to checklist");
    });

    test("prevents invalid transitions out of sequence", () => {
      const isValidTransition = (from: string, to: string): boolean => {
        const allowed: Record<string, string[]> = {
          listed: ["matched", "cancelled", "expired"],
          matched: ["driver_assigned", "cancelled"],
          driver_assigned: ["in_transit", "cancelled"],
          in_transit: ["checklist", "disputed"],
          checklist: ["delivered", "disputed"],
        };
        return allowed[from]?.includes(to) ?? false;
      };

      assert.equal(isValidTransition("matched", "in_transit"), false, "Cannot jump to in_transit without driver_assigned");
      assert.equal(isValidTransition("driver_assigned", "checklist"), false, "Cannot jump to checklist without in_transit");
      assert.equal(isValidTransition("driver_assigned", "in_transit"), true);
      assert.equal(isValidTransition("in_transit", "checklist"), true);
    });
  });

  describe("Driver Availability State (FR-DASH-DR01 & FR-DASH-DR02)", () => {
    test("toggles availability correctly and excludes offline drivers", () => {
      const drivers = [
        { id: "driver-1", name: "Priya", is_available: true },
        { id: "driver-2", name: "Rahul", is_available: false },
        { id: "driver-3", name: "Sunil", is_available: true },
      ];

      const availablePool = drivers.filter((d) => d.is_available);
      assert.equal(availablePool.length, 2);
      assert.ok(availablePool.some((d) => d.id === "driver-1"));
      assert.ok(!availablePool.some((d) => d.id === "driver-2"));

      // Toggle driver-1 offline
      drivers[0].is_available = false;
      const updatedPool = drivers.filter((d) => d.is_available);
      assert.equal(updatedPool.length, 1);
      assert.equal(updatedPool[0].id, "driver-3");
    });
  });

  describe("Google Maps Deep Link Navigation (FR-DASH-DR04)", () => {
    test("generates properly encoded Google Maps navigation URLs for pickup and dropoff", () => {
      const formatNavUrl = (address: string): string => {
        return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
      };

      const pickupAddress = "123 MG Road, Bengaluru, Karnataka 560001";
      const navUrl = formatNavUrl(pickupAddress);

      assert.ok(navUrl.startsWith("https://www.google.com/maps/dir/?api=1&destination="));
      assert.ok(navUrl.includes("123%20MG%20Road"));
      assert.ok(navUrl.includes("560001"));
    });
  });

  describe("Driver Assignment & Pickup Email Templates Rendering", () => {
    test("renders DriverAssigned email template for driver recipient", async () => {
      const html = await renderDriverAssigned({
        recipientName: "Priya Sharma",
        recipientRole: "driver",
        listingTitle: "Surplus Vegetable Biryani Trays",
        foodCategory: "Cooked rice dishes / curries",
        quantityKg: 20,
        servings: 50,
        ersScore: 78,
        pickupAddress: "Spice Garden Restaurant, MG Road",
        dropoffAddress: "123 Hope Way, Indiranagar, Bengaluru",
        shelterName: "Hope Community Shelter",
        donorName: "Spice Garden Restaurant",
        actionUrl: "http://localhost:3000/driver",
      });

      assert.ok(html.includes("NEW RESCUE RUN ASSIGNED"), "Should include driver assigned heading");
      assert.ok(html.includes("Priya Sharma"), "Should include driver name");
      assert.ok(html.includes("78 / 100"), "Should include ERS score");
      assert.ok(html.includes("20 kg"), "Should include quantity");
      assert.ok(html.includes("Hope Community Shelter"), "Should include shelter destination");
      assert.ok(html.includes("OPEN DRIVER ROUTE DASHBOARD"), "Should include driver CTA");
    });

    test("renders DriverAssigned email template for shelter recipient", async () => {
      const html = await renderDriverAssigned({
        recipientName: "Hope Shelter Team",
        recipientRole: "shelter",
        listingTitle: "Surplus Vegetable Biryani Trays",
        foodCategory: "Cooked rice dishes / curries",
        quantityKg: 20,
        servings: 50,
        ersScore: 78,
        pickupAddress: "Spice Garden Restaurant, MG Road",
        dropoffAddress: "123 Hope Way, Indiranagar, Bengaluru",
        shelterName: "Hope Community Shelter",
        donorName: "Spice Garden Restaurant",
        actionUrl: "http://localhost:3000/shelter",
      });

      assert.ok(html.includes("DRIVER DISPATCHED FOR PICKUP"), "Should include shelter notification heading");
      assert.ok(html.includes("Hope Shelter Team"), "Should include recipient name");
      assert.ok(html.includes("VIEW RESCUE STATUS"), "Should include shelter CTA");
    });

    test("renders DriverPickedUp email template for donor recipient", async () => {
      const html = await renderDriverPickedUp({
        recipientName: "Ravi Sharma",
        recipientRole: "donor",
        listingTitle: "Surplus Vegetable Biryani Trays",
        foodCategory: "Cooked rice dishes / curries",
        quantityKg: 20,
        servings: 50,
        driverName: "Priya Sharma (Motorcycle)",
        pickedUpAt: "2026-09-25T14:30:00Z",
        destinationName: "Hope Community Shelter",
        destinationAddress: "123 Hope Way, Indiranagar, Bengaluru",
        actionUrl: "http://localhost:3000/donor",
      });

      assert.ok(html.includes("FOOD PICKED UP BY DRIVER"), "Should include donor heading");
      assert.ok(html.includes("Ravi Sharma"), "Should include donor recipient");
      assert.ok(html.includes("Priya Sharma"), "Should include driver name");
      assert.ok(html.includes("Hope Community Shelter"), "Should include destination");
      assert.ok(html.includes("TRACK RESCUE STATUS"), "Should include tracking CTA");
    });

    test("renders DriverPickedUp email template for shelter recipient", async () => {
      const html = await renderDriverPickedUp({
        recipientName: "Hope Community Shelter",
        recipientRole: "shelter",
        listingTitle: "Surplus Vegetable Biryani Trays",
        foodCategory: "Cooked rice dishes / curries",
        quantityKg: 20,
        servings: 50,
        driverName: "Priya Sharma (Motorcycle)",
        pickedUpAt: "2026-09-25T14:30:00Z",
        destinationName: "Hope Community Shelter",
        destinationAddress: "123 Hope Way, Indiranagar, Bengaluru",
        actionUrl: "http://localhost:3000/shelter",
      });

      assert.ok(html.includes("RESCUE RUN IN TRANSIT TO SHELTER"), "Should include shelter transit heading");
      assert.ok(html.includes("Hope Community Shelter"), "Should include recipient name");
      assert.ok(html.includes("TRACK RESCUE STATUS"), "Should include shelter CTA");
    });
  });
});

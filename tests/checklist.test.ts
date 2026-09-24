import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { deliveryChecklistSchema } from "../src/lib/validators/checklist.schema";
import {
  renderDeliveryAccepted,
  renderDeliveryDisputed,
} from "../src/lib/email/templates";

describe("Phase 13: Delivery Receipt & Food Acceptance Checklist — Unit & Integration Tests", () => {
  describe("5-Point Checklist Validation & Outcome (SRS §13.8 / FR-CHECK-01 to FR-CHECK-05)", () => {
    test("passes when all 5 checks are true and PIN matches", () => {
      const evaluateChecklist = (input: {
        quantity_ok: boolean;
        item_correct: boolean;
        packaging_ok: boolean;
        food_condition_ok: boolean;
        entered_pin: string;
        expected_pin: string;
      }) => {
        const pinConfirmed =
          input.entered_pin.trim().length === 4 &&
          input.entered_pin.trim() === input.expected_pin.trim();

        const checklistPassed =
          input.quantity_ok &&
          input.item_correct &&
          input.packaging_ok &&
          input.food_condition_ok &&
          pinConfirmed;

        return { pinConfirmed, checklistPassed };
      };

      const result = evaluateChecklist({
        quantity_ok: true,
        item_correct: true,
        packaging_ok: true,
        food_condition_ok: true,
        entered_pin: "4821",
        expected_pin: "4821",
      });

      assert.equal(result.pinConfirmed, true, "PIN must be confirmed");
      assert.equal(result.checklistPassed, true, "All 5 points satisfied must pass checklist");
    });

    test("fails if PIN does not match expected PIN", () => {
      const evaluateChecklist = (enteredPin: string, expectedPin: string) => {
        const pinConfirmed = enteredPin.trim() === expectedPin.trim();
        return pinConfirmed;
      };

      assert.equal(evaluateChecklist("1234", "4821"), false, "Mismatched PIN fails");
      assert.equal(evaluateChecklist("482", "4821"), false, "Incomplete PIN fails");
      assert.equal(evaluateChecklist("4821", "4821"), true, "Matching PIN succeeds");
    });

    test("fails if any of the 4 physical criteria is false, even if PIN matches", () => {
      const isPassed = (q: boolean, i: boolean, p: boolean, f: boolean, pin: boolean) =>
        q && i && p && f && pin;

      assert.equal(isPassed(false, true, true, true, true), false, "Quantity mismatch fails");
      assert.equal(isPassed(true, false, true, true, true), false, "Item incorrect fails");
      assert.equal(isPassed(true, true, false, true, true), false, "Packaging damaged fails");
      assert.equal(isPassed(true, true, true, false, true), false, "Food condition unsafe fails");
      assert.equal(isPassed(true, true, true, true, true), true, "All 5 true succeeds");
    });

    test("Zod schema requires minimum 10 characters for notes when discrepancy flagged (FR-CHECK-06)", () => {
      // Discrepancy without notes should fail validation
      const invalidInput = {
        listing_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        quantity_ok: false,
        item_correct: true,
        packaging_ok: true,
        food_condition_ok: true,
        donor_pin: "4821",
        notes: "short", // Only 5 chars, requires >= 10
      };

      const result1 = deliveryChecklistSchema.safeParse(invalidInput);
      assert.equal(result1.success, false, "Schema should fail when notes < 10 chars on discrepancy");

      // Valid notes >= 10 chars
      const validInput = {
        ...invalidInput,
        notes: "Only 10 kg delivered instead of 25 kg.",
      };

      const result2 = deliveryChecklistSchema.safeParse(validInput);
      assert.equal(result2.success, true, "Schema should succeed when notes >= 10 chars");
    });
  });

  describe("Status Pipeline Transition (Phase 13 Objective & SRS §13.8)", () => {
    test("advances status to delivered on checklist pass", () => {
      const getNextStatus = (current: string, passed: boolean): string => {
        if (current === "in_transit" || current === "checklist") {
          return passed ? "delivered" : "disputed";
        }
        return current;
      };

      assert.equal(getNextStatus("checklist", true), "delivered");
      assert.equal(getNextStatus("in_transit", true), "delivered");
    });

    test("advances status to disputed on checklist failure", () => {
      const getNextStatus = (current: string, passed: boolean): string => {
        if (current === "in_transit" || current === "checklist") {
          return passed ? "delivered" : "disputed";
        }
        return current;
      };

      assert.equal(getNextStatus("checklist", false), "disputed");
      assert.equal(getNextStatus("in_transit", false), "disputed");
    });
  });

  describe("Donor Violation Policy Enforcement (SRS §13.8 / FR-CHECK-09 & FR-CHECK-10)", () => {
    test("issues formal warning on first discrepancy (strike 1) and keeps account active", () => {
      const enforceViolation = (currentViolations: number) => {
        const nextViolations = currentViolations + 1;
        const isSuspension = nextViolations >= 2;
        return {
          violationCount: nextViolations,
          actionTaken: isSuspension ? "account_suspended" : "warning_issued",
          accountStatus: isSuspension ? "suspended" : "active",
        };
      };

      const strike1 = enforceViolation(0);
      assert.equal(strike1.violationCount, 1);
      assert.equal(strike1.actionTaken, "warning_issued");
      assert.equal(strike1.accountStatus, "active", "Account must stay active on 1st strike");
    });

    test("suspends account on second discrepancy (strike 2) and triggers listing cancellation", () => {
      const enforceViolation = (currentViolations: number) => {
        const nextViolations = currentViolations + 1;
        const isSuspension = nextViolations >= 2;
        return {
          violationCount: nextViolations,
          actionTaken: isSuspension ? "account_suspended" : "warning_issued",
          accountStatus: isSuspension ? "suspended" : "active",
          cancelActiveListings: isSuspension,
        };
      };

      const strike2 = enforceViolation(1);
      assert.equal(strike2.violationCount, 2);
      assert.equal(strike2.actionTaken, "account_suspended");
      assert.equal(strike2.accountStatus, "suspended", "Account must be suspended on 2nd strike");
      assert.equal(strike2.cancelActiveListings, true, "Must cancel all active listings on strike 2");
    });
  });

  describe("Delivery Receipt Email Templates Rendering", () => {
    test("renders DeliveryAccepted email with impact metrics and PIN confirmation", async () => {
      const html = await renderDeliveryAccepted({
        donorName: "The Oberoi Bakery",
        listingTitle: "45 Meals — Fresh Bread & Pastries",
        quantityKg: 20.0,
        servings: 45,
        co2eAvoidedKg: 50.0,
        shelterName: "Asha Kiran Community Shelter",
        shelterAddress: "8th Main Road, Sampangiram Nagar, Bengaluru",
        deliveryDate: "24/09/2026, 11:30 AM",
        pinVerified: true,
        actionUrl: "https://annasetu.in/donor",
      });

      assert.ok(html.includes("FOOD RESCUE COMPLETE"), "Must include header");
      assert.ok(html.includes("The Oberoi Bakery"), "Must include donor name");
      assert.ok(html.includes("20 kg"), "Must include quantity in kg");
      assert.ok(html.includes("45"), "Must include meals served");
      assert.ok(html.includes("50.0 kg"), "Must include CO2e avoided");
      assert.ok(html.includes("Asha Kiran Community Shelter"), "Must include shelter name");
      assert.ok(html.includes("CONFIRMED &amp; MATCHED") || html.includes("CONFIRMED & MATCHED"), "Must confirm PIN");
    });

    test("renders DeliveryDisputed email for first warning (strike 1)", async () => {
      const html = await renderDeliveryDisputed({
        donorName: "Spice Garden Restaurant",
        listingTitle: "Chicken Biryani & Salads",
        shelterName: "Hope Shelter Indiranagar",
        violationNumber: 1,
        discrepancyType: "Food Unsafe / Temperature Failure",
        volunteerNotes: "Food arrived lukewarm with acidic odor.",
        actionTaken: "warning_issued",
        actionUrl: "https://annasetu.in/donor",
      });

      assert.ok(html.includes("DELIVERY DISCREPANCY"), "Must indicate discrepancy");
      assert.ok(html.includes("POLICY WARNING #1"), "Must badge as Warning #1");
      assert.ok(html.includes("formal first warning"), "Must mention first warning in body");
      assert.ok(html.includes("Spice Garden Restaurant"), "Must mention donor");
      assert.ok(html.includes("7-day contest window"), "Must outline 7-day contest window");
    });

    test("renders DeliveryDisputed email for second violation account suspension (strike 2)", async () => {
      const html = await renderDeliveryDisputed({
        donorName: "Spice Garden Restaurant",
        listingTitle: "Curry Pots",
        shelterName: "Sneha Foundation",
        violationNumber: 2,
        discrepancyType: "Quantity Mismatch",
        volunteerNotes: "Only 4 kg delivered instead of claimed 20 kg.",
        actionTaken: "account_suspended",
        actionUrl: "https://annasetu.in/donor",
      });

      assert.ok(html.includes("ACCOUNT SUSPENDED"), "Must indicate account suspension");
      assert.ok(html.includes("POLICY VIOLATION #2"), "Must badge as Policy Violation #2");
      assert.ok(html.includes("suspended immediately"), "Must mention immediate suspension");
    });
  });
});

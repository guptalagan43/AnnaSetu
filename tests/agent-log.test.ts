import { test, describe } from "node:test";
import assert from "node:assert";
import {
  validateOverrideReason,
  canOverrideAction,
  determineReversalPlan,
  DEMO_AGENT_LOGS,
  type AgentLogRecord,
} from "../src/lib/dispatcher/override";
import { renderAgentOverrideAlert } from "../src/lib/email/templates";

describe("Phase 18: Agent Log & Admin Override Panel — Unit & Integration Tests", () => {
  describe("Override Reason Validation (phases.md §18 / rules.md §5)", () => {
    test("accepts valid reason text with 5 or more characters", () => {
      const res = validateOverrideReason("Shelter phoned unable to receive dairy batch");
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.error, undefined);
    });

    test("rejects reason with fewer than 5 characters", () => {
      const res = validateOverrideReason("nope");
      assert.strictEqual(res.valid, false);
      assert.ok(res.error?.includes("at least 5 characters"));
    });

    test("rejects non-string or null reason input", () => {
      const res1 = validateOverrideReason(null);
      assert.strictEqual(res1.valid, false);

      const res2 = validateOverrideReason({});
      assert.strictEqual(res2.valid, false);
    });

    test("rejects excessively long reason (> 500 characters)", () => {
      const longReason = "a".repeat(501);
      const res = validateOverrideReason(longReason);
      assert.strictEqual(res.valid, false);
      assert.ok(res.error?.includes("cannot exceed 500 characters"));
    });
  });

  describe("Override Eligibility Rules (SRS §14 / phases.md §18)", () => {
    test("allows override on active AUTO_CONFIRM_SHELTER action", () => {
      const log = { action: "AUTO_CONFIRM_SHELTER", overridden_at: null };
      const res = canOverrideAction(log);
      assert.strictEqual(res.allowed, true);
    });

    test("allows override on active ASSIGN_DRIVER action", () => {
      const log = { action: "ASSIGN_DRIVER", overridden_at: null };
      const res = canOverrideAction(log);
      assert.strictEqual(res.allowed, true);
    });

    test("allows override on active ESCALATE_TO_ADMIN action", () => {
      const log = { action: "ESCALATE_TO_ADMIN", overridden_at: null };
      const res = canOverrideAction(log);
      assert.strictEqual(res.allowed, true);
    });

    test("rejects override if action has already been overridden", () => {
      const log = {
        action: "AUTO_CONFIRM_SHELTER",
        overridden_at: new Date().toISOString(),
      };
      const res = canOverrideAction(log);
      assert.strictEqual(res.allowed, false);
      assert.ok(res.reason?.includes("already been overridden"));
    });

    test("rejects override on non-reversible action type (SKIP_ALREADY_ACTIONED)", () => {
      const log = { action: "SKIP_ALREADY_ACTIONED", overridden_at: null };
      const res = canOverrideAction(log);
      assert.strictEqual(res.allowed, false);
      assert.ok(res.reason?.includes("not reversible"));
    });
  });

  describe("Reversal Plan Logic (phases.md §18 / SRS §14)", () => {
    test("AUTO_CONFIRM_SHELTER reversal plan resets listing to available and cancels match", () => {
      const plan = determineReversalPlan("AUTO_CONFIRM_SHELTER");
      assert.strictEqual(plan.newListingStatus, "available");
      assert.strictEqual(plan.newMatchStatus, "cancelled");
      assert.ok(plan.notifiedRoles.includes("shelter"));
      assert.ok(plan.notifiedRoles.includes("donor"));
      assert.ok(plan.reversalSummary.includes("open matching pool"));
    });

    test("ASSIGN_DRIVER reversal plan cancels driver assignment and keeps listing matched", () => {
      const plan = determineReversalPlan("ASSIGN_DRIVER");
      assert.strictEqual(plan.newListingStatus, "matched");
      assert.strictEqual(plan.newDriverAssignmentStatus, "cancelled");
      assert.ok(plan.notifiedRoles.includes("driver"));
      assert.ok(plan.notifiedRoles.includes("shelter"));
    });

    test("ESCALATE_TO_ADMIN reversal plan notifies admin", () => {
      const plan = determineReversalPlan("ESCALATE_TO_ADMIN");
      assert.ok(plan.notifiedRoles.includes("admin"));
      assert.ok(plan.reversalSummary.includes("manually resolved"));
    });
  });

  describe("AgentOverrideAlert Email Template (phases.md §18 / rules.md §5)", () => {
    test("renders AgentOverrideAlert email HTML with action details and reason", async () => {
      const html = await renderAgentOverrideAlert({
        actionType: "AUTO_CONFIRM_SHELTER",
        listingTitle: "Dal Makhani (40 Servings)",
        listingId: "list-test-1",
        reason: "Shelter refrigerator undergoing unscheduled maintenance",
        adminName: "Senior Admin",
        overriddenAt: "25 Sep 2026, 03:00 PM",
        recipientRole: "shelter",
        reversalSummary: "Shelter reserved capacity restored.",
      });

      assert.ok(typeof html === "string" && html.length > 0);
      assert.ok(html.includes("AUTO_CONFIRM_SHELTER"));
      assert.ok(html.includes("Dal Makhani"));
      assert.ok(html.includes("Shelter refrigerator undergoing unscheduled maintenance"));
      assert.ok(html.includes("Senior Admin"));
      assert.ok(html.includes("DISPATCHER ACTION OVERRIDDEN BY ADMIN"));
    });

    test("renders recipient-specific guidance for volunteer drivers", async () => {
      const html = await renderAgentOverrideAlert({
        actionType: "ASSIGN_DRIVER",
        listingTitle: "Veg Biryani",
        listingId: "list-test-2",
        reason: "Wrong vehicle capacity assigned",
        adminName: "Admin",
        overriddenAt: "25 Sep 2026, 03:00 PM",
        recipientRole: "driver",
        reversalSummary: "Driver assignment cancelled.",
      });

      assert.ok(html.includes("delivery dispatch assignment for this listing has been cancelled"));
    });
  });

  describe("Agent Log Data Model & Seed Validation", () => {
    test("DEMO_AGENT_LOGS contains required actions and fields", () => {
      assert.ok(DEMO_AGENT_LOGS.length >= 4);

      const autoConfirm = DEMO_AGENT_LOGS.find((l) => l.action === "AUTO_CONFIRM_SHELTER");
      assert.ok(autoConfirm);
      assert.ok(autoConfirm.listing_id);
      assert.ok(autoConfirm.reasoning);
      assert.ok(typeof autoConfirm.confidence === "number");

      const assignDriver = DEMO_AGENT_LOGS.find((l) => l.action === "ASSIGN_DRIVER");
      assert.ok(assignDriver);
      assert.ok(assignDriver.driver_id);

      const escalate = DEMO_AGENT_LOGS.find((l) => l.action === "ESCALATE_TO_ADMIN");
      assert.ok(escalate);
    });

    test("Confidence scores in DEMO_AGENT_LOGS are within valid range [0, 1]", () => {
      for (const log of DEMO_AGENT_LOGS) {
        if (typeof log.confidence === "number") {
          assert.ok(log.confidence >= 0 && log.confidence <= 1);
        }
      }
    });
  });
});

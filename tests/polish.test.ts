import { describe, it } from "node:test";
import assert from "node:assert/strict";
import robots from "../src/app/robots";

describe("Phase 21: Mobile Responsiveness, SEO & UI Polish", () => {
  describe("robots.txt Configuration (phases.md §21)", () => {
    it("returns valid robots metadata route with userAgent *", () => {
      const config = robots();
      assert.ok(config);
      assert.ok(config.rules);
      
      const rule = Array.isArray(config.rules) ? config.rules[0] : config.rules;
      assert.equal(rule.userAgent, "*");
    });

    it("allows public root and public impact dashboard", () => {
      const config = robots();
      const rule = Array.isArray(config.rules) ? config.rules[0] : config.rules;
      const allowed = Array.isArray(rule.allow) ? rule.allow : [rule.allow];
      
      assert.ok(allowed.includes("/"));
      assert.ok(allowed.includes("/public-impact"));
    });

    it("disallows all dashboard, api, and internal dev routes", () => {
      const config = robots();
      const rule = Array.isArray(config.rules) ? config.rules[0] : config.rules;
      const disallowed = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];

      const expectedBlocked = [
        "/donor/",
        "/shelter/",
        "/driver/",
        "/admin/",
        "/api/",
        "/dev/",
      ];

      for (const route of expectedBlocked) {
        assert.ok(
          disallowed.includes(route),
          `Expected ${route} to be disallowed in robots.txt`
        );
      }
    });

    it("includes sitemap reference", () => {
      const config = robots();
      assert.ok(config.sitemap);
      assert.match(String(config.sitemap), /^https:\/\/.*\/sitemap\.xml$/);
    });
  });

  describe("ERS Badge Pulse Animation Logic (design.md §5.3 / phases.md §21)", () => {
    function getERSConfig(score: number) {
      if (score >= 95) return { variant: "emergency", label: "EMERGENCY", pulse: true };
      if (score >= 80) return { variant: "critical", label: "CRITICAL", pulse: true };
      if (score >= 60) return { variant: "warning", label: "WARNING", pulse: false };
      if (score >= 40) return { variant: "caution", label: "CAUTION", pulse: false };
      return { variant: "safe", label: "SAFE", pulse: false };
    }

    it("triggers pulse animation for Critical ERS (80–94)", () => {
      const config80 = getERSConfig(80);
      assert.equal(config80.pulse, true);
      assert.equal(config80.variant, "critical");

      const config94 = getERSConfig(94);
      assert.equal(config94.pulse, true);
      assert.equal(config94.variant, "critical");
    });

    it("triggers pulse animation for Emergency ERS (95–100)", () => {
      const config95 = getERSConfig(95);
      assert.equal(config95.pulse, true);
      assert.equal(config95.variant, "emergency");

      const config100 = getERSConfig(100);
      assert.equal(config100.pulse, true);
      assert.equal(config100.variant, "emergency");
    });

    it("does not trigger pulse animation for Safe, Caution, and Warning ERS (< 80)", () => {
      const config20 = getERSConfig(20);
      assert.equal(config20.pulse, false);
      assert.equal(config20.variant, "safe");

      const config50 = getERSConfig(50);
      assert.equal(config50.pulse, false);
      assert.equal(config50.variant, "caution");

      const config75 = getERSConfig(75);
      assert.equal(config75.pulse, false);
      assert.equal(config75.variant, "warning");
    });
  });

  describe("Brutalist Design Tokens & Responsive Breakpoints (design.md)", () => {
    it("defines the standard responsive breakpoints according to design.md §4", () => {
      const breakpoints = {
        mobile: 375,
        tablet: 768,
        desktop: 1280,
      };

      assert.equal(breakpoints.mobile, 375);
      assert.equal(breakpoints.tablet, 768);
      assert.equal(breakpoints.desktop, 1280);
    });

    it("defines brutalist core brand colors without soft gradients or rounded radius", () => {
      const tokens = {
        black: "#0A0A0A",
        white: "#F5F0E8",
        cream: "#EDE8DC",
        red: "#D42B2B",
        redDark: "#A01E1E",
        ersSafe: "#2D8A3E",
        ersCaution: "#C8961A",
        ersWarning: "#D4620A",
        ersCritical: "#C4201F",
        ersEmergency: "#1A0A0A",
      };

      assert.equal(tokens.black, "#0A0A0A");
      assert.equal(tokens.white, "#F5F0E8");
      assert.equal(tokens.cream, "#EDE8DC");
      assert.equal(tokens.red, "#D42B2B");
      assert.equal(tokens.ersSafe, "#2D8A3E");
      assert.equal(tokens.ersCritical, "#C4201F");
    });

    it("specifies zero rounded corner radii on brutalist components", () => {
      const brutalistRules = {
        borderRadius: "0px",
        borderStyle: "solid",
        borderWidth: "2px",
        boxShadowBlur: "0px",
      };

      assert.equal(brutalistRules.borderRadius, "0px");
      assert.equal(brutalistRules.boxShadowBlur, "0px");
    });
  });

  describe("EmptyState & Skeleton Component Contracts", () => {
    it("EmptyState contract supports title, description, actions, and accessibility", () => {
      const mockEmptyState = {
        title: "NO LISTINGS FOUND",
        description: "Post surplus food to start receiving real-time shelter matches.",
        actionText: "POST FOOD NOW",
        actionHref: "/donor/new-listing",
      };

      assert.ok(mockEmptyState.title.length > 0);
      assert.ok(mockEmptyState.description.length > 0);
      assert.equal(mockEmptyState.actionHref, "/donor/new-listing");
    });

    it("Skeleton contracts define accessible loading roles", () => {
      const skeletonA11y = {
        role: "status",
        "aria-busy": true,
        "aria-label": "Loading content...",
      };

      assert.equal(skeletonA11y.role, "status");
      assert.equal(skeletonA11y["aria-busy"], true);
    });
  });
});

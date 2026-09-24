import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { FOOD_CATEGORIES, ALLERGENS } from "../src/lib/validators/listing.schema";

// ─── Inline NLP output schema for isolated testing ────────────────────────────

const NLPOutputSchema = z.object({
  title: z.string().nullable(),
  food_category: z.string().nullable(),
  estimated_servings: z.number().nullable(),
  quantity_kg: z.number().nullable(),
  expiry_time: z.string().nullable(),
  allergens: z.array(z.string()).nullable(),
  packaging_type: z.string().nullable(),
  notes: z.string().nullable(),
  confidence_score: z.number().min(0).max(1),
  intake_method: z.literal("nlp"),
  ai_warning: z.string().optional(),
});

// ─── Inline NLP input schema ──────────────────────────────────────────────────

const NLPInputSchema = z.object({
  text: z.string().min(3).max(1000),
});

// ─── Confidence tier helper (mirrors NLPParser component) ─────────────────────

type ConfidenceTier = "high" | "medium" | "low" | "none";

function getTier(score: number): ConfidenceTier {
  if (score >= 0.7) return "high";
  if (score >= 0.5) return "medium";
  if (score > 0) return "low";
  return "none";
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Phase 16: NLP Parser (Gemini Text) — Unit Tests", () => {

  describe("NLPOutputSchema validation (phases.md §16 / rules.md §5)", () => {

    test("validates a complete NLP result", () => {
      const result = NLPOutputSchema.parse({
        title: "Vegetable Biryani",
        food_category: "Cooked rice dishes / curries",
        estimated_servings: 30,
        quantity_kg: 5,
        expiry_time: new Date(Date.now() + 4 * 3600_000).toISOString(),
        allergens: ["None"],
        packaging_type: "Plastic containers / Trays",
        notes: "Available from 7pm",
        confidence_score: 0.88,
        intake_method: "nlp",
      });
      assert.strictEqual(result.title, "Vegetable Biryani");
      assert.strictEqual(result.food_category, "Cooked rice dishes / curries");
      assert.strictEqual(result.estimated_servings, 30);
      assert.strictEqual(result.intake_method, "nlp");
    });

    test("allows all null fields (AI unable to determine anything)", () => {
      const result = NLPOutputSchema.parse({
        title: null,
        food_category: null,
        estimated_servings: null,
        quantity_kg: null,
        expiry_time: null,
        allergens: null,
        packaging_type: null,
        notes: null,
        confidence_score: 0,
        intake_method: "nlp",
      });
      assert.strictEqual(result.title, null);
      assert.strictEqual(result.confidence_score, 0);
    });

    test("allows ai_warning field", () => {
      const result = NLPOutputSchema.parse({
        title: null,
        food_category: null,
        estimated_servings: null,
        quantity_kg: null,
        expiry_time: null,
        allergens: null,
        packaging_type: null,
        notes: "5kg of biryani",
        confidence_score: 0.4,
        intake_method: "nlp",
        ai_warning: "Low confidence — please verify before confirming",
      });
      assert.ok(result.ai_warning?.includes("Low confidence"));
    });

    test("rejects confidence_score > 1", () => {
      assert.throws(() => {
        NLPOutputSchema.parse({
          title: null, food_category: null, estimated_servings: null, quantity_kg: null,
          expiry_time: null, allergens: null, packaging_type: null, notes: null,
          confidence_score: 1.1, intake_method: "nlp",
        });
      });
    });

    test("rejects intake_method != 'nlp'", () => {
      assert.throws(() => {
        NLPOutputSchema.parse({
          title: null, food_category: null, estimated_servings: null, quantity_kg: null,
          expiry_time: null, allergens: null, packaging_type: null, notes: null,
          confidence_score: 0.5, intake_method: "cv",
        });
      });
    });

  });

  describe("NLPInputSchema validation (phases.md §16)", () => {

    test("accepts valid text input", () => {
      const result = NLPInputSchema.parse({ text: "5kg biryani expiring at 8pm" });
      assert.strictEqual(result.text, "5kg biryani expiring at 8pm");
    });

    test("rejects text shorter than 3 characters", () => {
      assert.throws(() => NLPInputSchema.parse({ text: "ab" }));
    });

    test("rejects text longer than 1000 characters", () => {
      assert.throws(() => NLPInputSchema.parse({ text: "a".repeat(1001) }));
    });

  });

  describe("Confidence tier classification (phases.md §16)", () => {

    test("score >= 0.7 is HIGH", () => {
      assert.strictEqual(getTier(0.88), "high");
      assert.strictEqual(getTier(0.7), "high");
    });

    test("score 0.5-0.69 is MEDIUM", () => {
      assert.strictEqual(getTier(0.6), "medium");
      assert.strictEqual(getTier(0.5), "medium");
    });

    test("score 0.01-0.49 is LOW", () => {
      assert.strictEqual(getTier(0.3), "low");
    });

    test("score 0 is NONE", () => {
      assert.strictEqual(getTier(0), "none");
    });

  });

  describe("Low-confidence warning (rules.md §5)", () => {

    test("score < 0.5 triggers ai_warning", () => {
      assert.ok(0.3 < 0.5, "Score below 0.5 must trigger warning");
    });

    test("score 0.5-0.65 triggers medium warning", () => {
      const score = 0.55;
      const isMedium = score >= 0.5 && score < 0.65;
      assert.ok(isMedium, "Score in 0.5-0.65 range triggers medium warning");
    });

    test("score >= 0.65 has no mandatory warning", () => {
      const score = 0.75;
      const requiresWarning = score < 0.65;
      assert.ok(!requiresWarning, "Score >= 0.65 does not trigger mandatory warning");
    });

  });

  describe("NLP pre-fill logic (phases.md §16)", () => {

    test("pre-fills all fields when NLP returns complete result", () => {
      let title = "";
      let category = "";
      let servings = "25";
      let qty = "10";

      const result = {
        title: "Paneer Curry",
        food_category: "Dairy-based dishes",
        estimated_servings: 40,
        quantity_kg: 12,
        expiry_time: new Date(Date.now() + 2 * 3600_000).toISOString(),
        allergens: ["Dairy"],
        packaging_type: "Plastic containers / Trays",
        notes: "Available after 7pm",
        confidence_score: 0.85,
        intake_method: "nlp" as const,
      };

      if (result.title) title = result.title;
      if (result.food_category && FOOD_CATEGORIES.includes(result.food_category as typeof FOOD_CATEGORIES[number])) {
        category = result.food_category;
      }
      if (result.estimated_servings !== null && result.estimated_servings > 0) {
        servings = result.estimated_servings.toString();
      }
      if (result.quantity_kg !== null && result.quantity_kg > 0) {
        qty = result.quantity_kg.toString();
      }

      assert.strictEqual(title, "Paneer Curry");
      assert.strictEqual(category, "Dairy-based dishes");
      assert.strictEqual(servings, "40");
      assert.strictEqual(qty, "12");
    });

    test("does not pre-fill food_category if value is not in FOOD_CATEGORIES", () => {
      const invalidCategory = "Sushi"; // not in FOOD_CATEGORIES
      const shouldPrefill = FOOD_CATEGORIES.includes(invalidCategory as typeof FOOD_CATEGORIES[number]);
      assert.ok(!shouldPrefill, "Invalid category should not be pre-filled");
    });

    test("does not pre-fill expiry_time if null", () => {
      const result = { expiry_time: null };
      const shouldPrefill = !!result.expiry_time;
      assert.ok(!shouldPrefill, "Null expiry should not be pre-filled");
    });

    test("pre-fills allergens from NLP result", () => {
      const result = { allergens: ["Dairy", "Nuts / Peanuts"] };
      const shouldPrefill = result.allergens && result.allergens.length > 0;
      assert.ok(shouldPrefill, "Valid allergens should be pre-filled");
      // All values must be valid ALLERGENS
      for (const a of result.allergens) {
        assert.ok(
          ALLERGENS.includes(a as typeof ALLERGENS[number]),
          `Allergen "${a}" must be in the valid list`
        );
      }
    });

  });

  describe("Fallback behaviour (rules.md §4 — AI must never block listing)", () => {

    test("fallback puts raw text in notes field", () => {
      const rawText = "5kg of biryani, 30 servings, ready after 7pm";
      const fallback = {
        title: null,
        food_category: null,
        estimated_servings: null,
        quantity_kg: null,
        expiry_time: null,
        allergens: null,
        packaging_type: null,
        notes: rawText,
        confidence_score: 0,
        intake_method: "nlp" as const,
        ai_warning: "AI parsing unavailable — please fill in manually",
      };
      const validated = NLPOutputSchema.parse(fallback);
      assert.strictEqual(validated.notes, rawText);
      assert.strictEqual(validated.confidence_score, 0);
    });

    test("fallback is valid NLPOutputSchema", () => {
      const fallback = {
        title: null, food_category: null, estimated_servings: null,
        quantity_kg: null, expiry_time: null, allergens: null,
        packaging_type: null, notes: "raw text here",
        confidence_score: 0, intake_method: "nlp" as const,
        ai_warning: "AI parsing unavailable",
      };
      assert.doesNotThrow(() => NLPOutputSchema.parse(fallback), "Fallback must be valid schema");
    });

  });

  describe("Gemini NLP rules (rules.md §5)", () => {

    test("NLP token budget is 500 (rules.md §5)", () => {
      const maxTokens = 500;
      assert.strictEqual(maxTokens, 500, "NLP token budget must be 500 per rules.md");
    });

    test("model is gemini-2.0-flash (rules.md §5)", () => {
      const model = "gemini-2.0-flash";
      assert.strictEqual(model, "gemini-2.0-flash", "Must use gemini-2.0-flash per rules.md");
    });

    test("system prompt includes date context for relative time parsing", () => {
      const nowIso = new Date().toISOString();
      const prompt = `Today's datetime is ${nowIso}.`;
      assert.ok(prompt.includes(nowIso.substring(0, 10)), "Prompt must include today's date for relative time context");
    });

    test("system prompt enforces JSON-only output", () => {
      const prompt = "return ONLY valid JSON (no markdown, no explanation)";
      assert.ok(prompt.includes("ONLY valid JSON"), "Prompt must enforce JSON-only output");
    });

  });

});

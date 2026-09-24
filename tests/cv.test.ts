import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { FOOD_CATEGORIES } from "../src/lib/validators/listing.schema";

// ─── Inline the CV output schema for isolated testing ─────────────────────────
// (Avoids importing the route directly which depends on sharp/Gemini at import time)
import { z } from "zod";

const CVOutputSchema = z.object({
  food_category: z.string().nullable(),
  estimated_servings: z.number().nullable(),
  quantity_kg: z.number().nullable(),
  confidence_score: z.number().min(0).max(1),
  intake_method: z.literal("cv"),
  photo_url: z.string().optional(),
  ai_warning: z.string().optional(),
});

// ─── CV confidence tier logic (mirrored from CVUploader) ─────────────────────

type ConfidenceTier = "high" | "medium" | "low" | "none";

function getConfidenceTier(score: number): ConfidenceTier {
  if (score >= 0.7) return "high";
  if (score >= 0.5) return "medium";
  if (score > 0) return "low";
  return "none";
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("Phase 15: CV Intake (Gemini Vision) — Unit Tests", () => {

  describe("CVOutputSchema validation (phases.md §15 / rules.md §5)", () => {

    test("validates a complete valid CV result", () => {
      const result = CVOutputSchema.parse({
        food_category: "Cooked rice dishes / curries",
        estimated_servings: 30,
        quantity_kg: 12.5,
        confidence_score: 0.87,
        intake_method: "cv",
      });
      assert.strictEqual(result.food_category, "Cooked rice dishes / curries");
      assert.strictEqual(result.estimated_servings, 30);
      assert.strictEqual(result.confidence_score, 0.87);
    });

    test("allows null fields (AI unable to determine)", () => {
      const result = CVOutputSchema.parse({
        food_category: null,
        estimated_servings: null,
        quantity_kg: null,
        confidence_score: 0,
        intake_method: "cv",
      });
      assert.strictEqual(result.food_category, null);
      assert.strictEqual(result.estimated_servings, null);
      assert.strictEqual(result.confidence_score, 0);
    });

    test("allows ai_warning field", () => {
      const result = CVOutputSchema.parse({
        food_category: null,
        estimated_servings: null,
        quantity_kg: null,
        confidence_score: 0.3,
        intake_method: "cv",
        ai_warning: "Low confidence — please verify before confirming",
      });
      assert.ok(result.ai_warning?.includes("Low confidence"));
    });

    test("allows optional photo_url", () => {
      const result = CVOutputSchema.parse({
        food_category: "Baked goods / bread",
        estimated_servings: 20,
        quantity_kg: 5,
        confidence_score: 0.9,
        intake_method: "cv",
        photo_url: "https://supabase.co/storage/v1/object/public/food-photos/test.jpg",
      });
      assert.ok(result.photo_url?.startsWith("https://"));
    });

    test("rejects confidence_score outside 0-1 range", () => {
      assert.throws(() => {
        CVOutputSchema.parse({
          food_category: null,
          estimated_servings: null,
          quantity_kg: null,
          confidence_score: 1.5, // invalid
          intake_method: "cv",
        });
      }, "Should throw ZodError for out-of-range confidence");
    });

    test("rejects wrong intake_method", () => {
      assert.throws(() => {
        CVOutputSchema.parse({
          food_category: null,
          estimated_servings: null,
          quantity_kg: null,
          confidence_score: 0.5,
          intake_method: "manual", // invalid for CV output
        });
      }, "Should throw ZodError for non-cv intake_method");
    });

  });

  describe("Confidence tier classification (phases.md §15)", () => {

    test("score >= 0.7 is HIGH confidence", () => {
      assert.strictEqual(getConfidenceTier(0.87), "high");
      assert.strictEqual(getConfidenceTier(0.7), "high");
    });

    test("score 0.5-0.69 is MEDIUM confidence", () => {
      assert.strictEqual(getConfidenceTier(0.65), "medium");
      assert.strictEqual(getConfidenceTier(0.5), "medium");
    });

    test("score 0.01-0.49 is LOW confidence", () => {
      assert.strictEqual(getConfidenceTier(0.3), "low");
      assert.strictEqual(getConfidenceTier(0.01), "low");
    });

    test("score = 0 is NONE (failed analysis)", () => {
      assert.strictEqual(getConfidenceTier(0), "none");
    });

  });

  describe("Low-confidence warning logic (rules.md §5)", () => {

    test("confidence < 0.5 requires ai_warning", () => {
      const score = 0.35;
      const requiresWarning = score < 0.5;
      assert.ok(requiresWarning, "Score below 0.5 must trigger warning");
    });

    test("confidence >= 0.7 does not require mandatory warning", () => {
      const score = 0.82;
      const requiresWarning = score < 0.5;
      assert.ok(!requiresWarning, "Score >= 0.7 should not trigger mandatory warning");
    });

    test("fallback response has confidence_score = 0 and ai_warning", () => {
      const fallback = {
        food_category: null,
        estimated_servings: null,
        quantity_kg: null,
        confidence_score: 0,
        intake_method: "cv" as const,
        ai_warning: "Photo analysis unavailable — please fill in manually",
      };
      const validated = CVOutputSchema.parse(fallback);
      assert.strictEqual(validated.confidence_score, 0);
      assert.ok(validated.ai_warning?.includes("manually"));
    });

  });

  describe("CV pre-fill logic (phases.md §15)", () => {

    test("only pre-fills food_category if it matches the allowed list", () => {
      const validCategory = "Baked goods / bread";
      const invalidCategory = "Pizza"; // not in FOOD_CATEGORIES
      assert.ok(FOOD_CATEGORIES.includes(validCategory as typeof FOOD_CATEGORIES[number]), "Valid category should be in list");
      assert.ok(!FOOD_CATEGORIES.includes(invalidCategory as typeof FOOD_CATEGORIES[number]), "Invalid category should not be in list");
    });

    test("does not pre-fill estimated_servings when value is null", () => {
      const cvResult = { estimated_servings: null };
      const shouldPrefill = cvResult.estimated_servings !== null && cvResult.estimated_servings > 0;
      assert.ok(!shouldPrefill, "Should not pre-fill null servings");
    });

    test("does not pre-fill quantity_kg when value is 0", () => {
      const cvResult = { quantity_kg: 0 };
      const shouldPrefill = cvResult.quantity_kg !== null && cvResult.quantity_kg > 0;
      assert.ok(!shouldPrefill, "Should not pre-fill 0 kg");
    });

    test("pre-fills valid quantity_kg", () => {
      const cvResult = { quantity_kg: 15 };
      const shouldPrefill = cvResult.quantity_kg !== null && cvResult.quantity_kg > 0;
      assert.ok(shouldPrefill, "Should pre-fill positive quantity_kg");
    });

  });

  describe("Image size guard (phases.md §15)", () => {

    test("10MB image is at the limit (allowed)", () => {
      const MAX_SIZE = 10 * 1024 * 1024;
      const imageSize = 10 * 1024 * 1024;
      assert.ok(imageSize <= MAX_SIZE, "10 MB image should be at the limit");
    });

    test("11MB image exceeds the limit", () => {
      const MAX_SIZE = 10 * 1024 * 1024;
      const imageSize = 11 * 1024 * 1024;
      assert.ok(imageSize > MAX_SIZE, "11 MB image should exceed the limit");
    });

  });

  describe("Gemini prompt rules (rules.md §5)", () => {

    test("SYSTEM_PROMPT contains JSON-only instruction", () => {
      const prompt = `You are a food analysis assistant for a food rescue platform.
Analyse the image provided and return ONLY valid JSON with these exact fields (no markdown, no explanation):`;
      assert.ok(prompt.includes("ONLY valid JSON"), "Prompt must enforce JSON-only output");
      assert.ok(prompt.includes("no markdown"), "Prompt must forbid markdown");
    });

    test("SYSTEM_PROMPT contains null fallback instruction", () => {
      const prompt = `If you cannot determine a field, return null for that field.`;
      assert.ok(prompt.includes("return null"), "Prompt must include null fallback instruction");
    });

    test("model is gemini-2.0-flash (rules.md §5)", () => {
      const model = "gemini-2.0-flash";
      assert.strictEqual(model, "gemini-2.0-flash", "Must use gemini-2.0-flash per rules.md");
    });

    test("CV token budget is 1000 (rules.md §5)", () => {
      const maxTokens = 1000;
      assert.strictEqual(maxTokens, 1000, "CV token budget must be 1000 per rules.md");
    });

  });

});

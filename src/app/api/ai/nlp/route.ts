/**
 * POST /api/ai/nlp
 *
 * Receives a free-text description of food (from voice or typed input),
 * calls Gemini Text API, and returns structured listing fields as JSON.
 *
 * Rules (rules.md §4 / §5):
 *   - Never block listing creation if AI fails — always return a fallback
 *   - AI output must be Zod-validated before use
 *   - Never call Gemini from the client — always proxy through this route
 *   - AI confidence < 0.5 must carry a warning message
 *   - Max token budget: 500 for NLP (rules.md §5)
 *   - Model: gemini-2.0-flash (rules.md §5)
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { FOOD_CATEGORIES, ALLERGENS, PACKAGING_TYPES } from "@/lib/validators/listing.schema";

// ─── Output schema ─────────────────────────────────────────────────────────────

const NLPOutputSchema = z.object({
  title: z.string().nullable(),
  food_category: z.string().nullable(),
  estimated_servings: z.number().nullable(),
  quantity_kg: z.number().nullable(),
  expiry_time: z.string().nullable(),   // ISO 8601 string or null
  allergens: z.array(z.string()).nullable(),
  packaging_type: z.string().nullable(),
  notes: z.string().nullable(),
  confidence_score: z.number().min(0).max(1),
  intake_method: z.literal("nlp"),
  ai_warning: z.string().optional(),
});

export type NLPOutput = z.infer<typeof NLPOutputSchema>;

// ─── Input schema ──────────────────────────────────────────────────────────────

const NLPInputSchema = z.object({
  text: z
    .string()
    .min(3, "Description must be at least 3 characters")
    .max(1000, "Description cannot exceed 1000 characters"),
});

// ─── Gemini prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(nowIso: string): string {
  return `You are a food listing assistant for a food rescue platform. Today's datetime is ${nowIso}.

Parse the free-text food description below and return ONLY valid JSON (no markdown, no explanation):
{
  "title": string or null,
  "food_category": string or null,
  "estimated_servings": integer or null,
  "quantity_kg": number or null,
  "expiry_time": ISO 8601 datetime string or null,
  "allergens": array of strings or null,
  "packaging_type": string or null,
  "notes": string or null,
  "confidence_score": number between 0.0 and 1.0
}

RULES:
- title: short descriptive name of the food (e.g., "Vegetable Biryani", "Paneer Curry")
- food_category must be exactly one of: ${FOOD_CATEGORIES.join(", ")}
- allergens must only contain values from: ${ALLERGENS.join(", ")} — use ["None"] if no allergens mentioned
- packaging_type must be exactly one of: ${PACKAGING_TYPES.join(", ")}
- expiry_time: compute from context (e.g., "expiring at 8pm" means today at 8pm in ISO 8601)
- confidence_score reflects how complete and certain the parsing is (0 = very uncertain, 1 = completely certain)
- If you cannot determine a field, return null for that field.
- Respond ONLY with valid JSON.`;
}

// ─── Fallback ──────────────────────────────────────────────────────────────────

const fallback = (reason: string): NLPOutput => ({
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
  ai_warning: reason,
});

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Validate input
    const body: unknown = await request.json();
    const parsed = NLPInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input", code: "VALIDATION_ERROR" },
        { status: 422 }
      );
    }

    const { text } = parsed.data;

    // 2. Check Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[NLP] GEMINI_API_KEY not set");
      return NextResponse.json(fallback("AI parsing unavailable — please fill in manually"), { status: 200 });
    }

    // 3. Call Gemini Text API (gemini-2.0-flash, 500 token budget — rules.md §5)
    let rawJson: string;
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: { maxOutputTokens: 500 }, // rules.md: 500 token budget for NLP
      });

      const nowIso = new Date().toISOString();
      const systemPrompt = buildSystemPrompt(nowIso);

      const result = await model.generateContent([systemPrompt, text]);
      rawJson = result.response.text().trim();
    } catch (geminiErr) {
      console.error("[NLP] Gemini Text API failed:", geminiErr);
      return NextResponse.json(fallback("Text parsing unavailable — please fill in manually"), { status: 200 });
    }

    // 4. Strip any accidental markdown fences
    const cleaned = rawJson
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    // 5. Parse JSON
    let parsed2: unknown;
    try {
      parsed2 = JSON.parse(cleaned);
    } catch {
      console.error("[NLP] Gemini returned invalid JSON:", cleaned);
      return NextResponse.json(fallback("AI returned unreadable response — please fill in manually"), { status: 200 });
    }

    // 6. Zod-validate output (rules.md §5: AI output must always be Zod-validated)
    const validation = NLPOutputSchema.safeParse({
      ...(parsed2 as object),
      intake_method: "nlp",
    });

    if (!validation.success) {
      console.error("[NLP] Gemini output failed Zod validation:", validation.error.issues);
      return NextResponse.json(fallback("AI output was incomplete — please fill in manually"), { status: 200 });
    }

    const output = validation.data;

    // 7. Attach low-confidence warning per rules.md §5
    if (output.confidence_score < 0.5) {
      output.ai_warning = "Low confidence — please verify before confirming";
    } else if (output.confidence_score < 0.65) {
      output.ai_warning = "Medium confidence — please review the parsed fields";
    }

    return NextResponse.json({ data: output });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[NLP] Unexpected error:", message);
    // rules.md §4: AI must never block listing — return fallback, not 500
    return NextResponse.json(
      fallback("AI text parsing temporarily unavailable — please fill in manually"),
      { status: 200 }
    );
  }
}

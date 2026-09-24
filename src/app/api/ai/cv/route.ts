/**
 * POST /api/ai/cv
 *
 * Receives a food photo as multipart/form-data (field: "image"),
 * pre-processes with sharp (resize to 1024px, JPEG quality 85),
 * sends to Gemini Vision, and returns structured JSON.
 *
 * Rules (rules.md §4 / §5):
 *   - Never block listing creation if AI fails — always return a fallback
 *   - AI output must be Zod-validated before use
 *   - Proxy only — never call Gemini from the client
 *   - AI confidence < 0.5 must carry a warning message
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import sharp from "sharp";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── Output schema ─────────────────────────────────────────────────────────────

const CVOutputSchema = z.object({
  food_category: z.string().nullable(),
  estimated_servings: z.number().nullable(),
  quantity_kg: z.number().nullable(),
  confidence_score: z.number().min(0).max(1),
  intake_method: z.literal("cv"),
  photo_url: z.string().optional(),
  ai_warning: z.string().optional(),
});

export type CVOutput = z.infer<typeof CVOutputSchema>;

// ─── Gemini prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a food analysis assistant for a food rescue platform.
Analyse the image provided and return ONLY valid JSON with these exact fields (no markdown, no explanation):
{
  "food_category": string or null,
  "estimated_servings": integer or null,
  "quantity_kg": number or null,
  "confidence_score": number between 0.0 and 1.0
}

food_category must be one of these exact strings:
"Cooked rice dishes / curries", "Dal / lentil dishes", "Roti / bread / flatbread",
"Biryani / pulao", "Sweets / desserts / mithai", "Snacks / fried items",
"Fresh produce / raw vegetables", "Dairy-based dishes", "Beverages",
"Baked goods / bread", "Packaged / sealed food", "Other / mixed"

If you cannot determine a field, return null for that field.
confidence_score must reflect your certainty (0 = no idea, 1 = completely certain).
Respond ONLY with valid JSON.`;

// ─── Fallback response ─────────────────────────────────────────────────────────

const fallback = (reason: string): CVOutput => ({
  food_category: null,
  estimated_servings: null,
  quantity_kg: null,
  confidence_score: 0,
  intake_method: "cv",
  ai_warning: reason,
});

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Parse multipart form data
    const form = await request.formData();
    const imageFile = form.get("image");

    if (!imageFile || !(imageFile instanceof Blob)) {
      return NextResponse.json(
        { error: "No image file uploaded", code: "MISSING_IMAGE" },
        { status: 400 }
      );
    }

    // Max 10 MB
    if (imageFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image too large (max 10 MB)", code: "IMAGE_TOO_LARGE" },
        { status: 413 }
      );
    }

    // 2. Read image buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // 3. Pre-process with sharp: resize to 1024px wide, JPEG quality 85 (rules.md §1)
    let processedBuffer: Buffer;
    try {
      processedBuffer = await sharp(inputBuffer)
        .resize({ width: 1024, withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
    } catch (sharpErr) {
      console.error("[CV] Sharp pre-processing failed:", sharpErr);
      return NextResponse.json(fallback("Photo could not be processed — please fill in manually"), { status: 200 });
    }

    // 4. Check Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("[CV] GEMINI_API_KEY not set");
      return NextResponse.json(fallback("AI analysis unavailable — please fill in manually"), { status: 200 });
    }

    // 5. Call Gemini Vision (gemini-2.0-flash per rules.md §5)
    let rawJson: string;
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: { maxOutputTokens: 1000 }, // rules.md: 1000 token budget for CV
      });

      const base64Image = processedBuffer.toString("base64");
      const mimeType = "image/jpeg";

      const result = await model.generateContent([
        SYSTEM_PROMPT,
        {
          inlineData: {
            mimeType,
            data: base64Image,
          },
        },
      ]);

      rawJson = result.response.text().trim();
    } catch (geminiErr) {
      console.error("[CV] Gemini Vision API failed:", geminiErr);
      return NextResponse.json(fallback("Photo analysis unavailable — please fill in manually"), { status: 200 });
    }

    // 6. Strip any accidental markdown fences
    const cleaned = rawJson
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    // 7. Parse and Zod-validate output (rules.md §5: AI output must always be Zod-validated)
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[CV] Gemini returned invalid JSON:", cleaned);
      return NextResponse.json(fallback("AI returned unreadable response — please fill in manually"), { status: 200 });
    }

    const validation = CVOutputSchema.safeParse({
      ...(parsed as object),
      intake_method: "cv",
    });

    if (!validation.success) {
      console.error("[CV] Gemini output failed Zod validation:", validation.error.issues);
      return NextResponse.json(fallback("AI output was incomplete — please fill in manually"), { status: 200 });
    }

    const output = validation.data;

    // 9. Upload processed image to Supabase Storage (food-photos bucket)
    //    Failure is non-blocking — the URL just won't be set
    let photoUrl: string | undefined;
    try {
      const supabase = createAdminClient();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("food-photos")
        .upload(fileName, processedBuffer, {
          contentType: "image/jpeg",
          upsert: false,
        });
      if (!uploadErr && uploadData) {
        const { data: urlData } = supabase.storage.from("food-photos").getPublicUrl(uploadData.path);
        photoUrl = urlData.publicUrl;
      }
    } catch (storageErr) {
      console.error("[CV] Supabase Storage upload failed (non-blocking):", storageErr);
    }

    if (photoUrl) {
      output.photo_url = photoUrl;
    }

    // 10. Attach low-confidence warning (rules.md §5: confidence < 0.5 must show warning)
    if (output.confidence_score < 0.5) {
      output.ai_warning =
        "Low confidence — please verify before confirming";
    } else if (output.confidence_score < 0.6) {
      output.ai_warning =
        "Medium confidence — please verify the details below";
    }

    return NextResponse.json({ data: output });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[CV] Unexpected error:", message);
    // rules.md §4: AI must never block listing — return fallback, not 500
    return NextResponse.json(
      fallback("AI analysis temporarily unavailable — please fill in manually"),
      { status: 200 }
    );
  }
}

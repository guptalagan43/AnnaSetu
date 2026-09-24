"use client";

/**
 * NLPParser — Free-text + Voice NLP intake component (Phase 16)
 *
 * Features:
 *   - Text area: donor types a description
 *   - Voice input: browser SpeechRecognition API → fills text area
 *   - "Parse with AI" button → calls POST /api/ai/nlp
 *   - Side-by-side: raw text on left, parsed fields on right for confirmation
 *   - Graceful fallback: if NLP fails, text stays in description field
 *
 * Rules (rules.md §5):
 *   - Never blocks listing creation
 *   - Low confidence shows warning
 *   - AI output Zod-validated in the API route (before reaching here)
 */

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export interface NLPResult {
  title: string | null;
  food_category: string | null;
  estimated_servings: number | null;
  quantity_kg: number | null;
  expiry_time: string | null;
  allergens: string[] | null;
  packaging_type: string | null;
  notes: string | null;
  confidence_score: number;
  intake_method: "nlp";
  ai_warning?: string;
}

interface NLPParserProps {
  onResult: (result: NLPResult) => void;
}

type ParseState = "idle" | "parsing" | "done" | "error";

type ConfidenceTier = "high" | "medium" | "low" | "none";

function getTier(score: number): ConfidenceTier {
  if (score >= 0.7) return "high";
  if (score >= 0.5) return "medium";
  if (score > 0) return "low";
  return "none";
}

function tierBadge(tier: ConfidenceTier): "success" | "warning" | "caution" | "emergency" {
  const map: Record<ConfidenceTier, "success" | "warning" | "caution" | "emergency"> = {
    high: "success", medium: "warning", low: "caution", none: "emergency",
  };
  return map[tier];
}

// SpeechRecognition types (not in lib.dom.d.ts in older setups)
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

export function NLPParser({ onResult }: NLPParserProps) {
  const [text, setText] = useState("");
  const [parseState, setParseState] = useState<ParseState>("idle");
  const [result, setResult] = useState<NLPResult | null>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // ─── Voice input ──────────────────────────────────────────────────────────

  const startVoice = useCallback(() => {
    const SpeechRec = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Voice input is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    const rec = new SpeechRec();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      setText((prev) => prev ? `${prev} ${transcript}` : transcript);
      setIsListening(false);
    };

    rec.onerror = () => {
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = rec;
    rec.start();
    setIsListening(true);
  }, []);

  const stopVoice = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  // ─── Parse action ─────────────────────────────────────────────────────────

  async function handleParse() {
    if (!text.trim()) return;
    setParseState("parsing");
    setResult(null);

    try {
      const res = await fetch("/api/ai/nlp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });

      const json = await res.json();

      // /api/ai/nlp always returns 200 with fallback — never blocks
      const nlpResult: NLPResult = json.data ?? {
        title: null,
        food_category: null,
        estimated_servings: null,
        quantity_kg: null,
        expiry_time: null,
        allergens: null,
        packaging_type: null,
        notes: text.trim(), // put raw text in notes as fallback
        confidence_score: 0,
        intake_method: "nlp",
        ai_warning: "AI parsing unavailable — please fill in manually",
      };

      setResult(nlpResult);
      setParseState("done");
    } catch {
      // Network failure — still provide fallback with raw text in notes
      const fallback: NLPResult = {
        title: null,
        food_category: null,
        estimated_servings: null,
        quantity_kg: null,
        expiry_time: null,
        allergens: null,
        packaging_type: null,
        notes: text.trim(),
        confidence_score: 0,
        intake_method: "nlp",
        ai_warning: "Could not reach AI service — please fill in manually",
      };
      setResult(fallback);
      setParseState("error");
    }
  }

  function handleApply() {
    if (result) {
      onResult(result);
    }
  }

  function handleReset() {
    setText("");
    setResult(null);
    setParseState("idle");
  }

  const tier = result ? getTier(result.confidence_score) : "none";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="font-body text-body-sm text-brand-black/60">
          Type or speak a food description. AI will parse it into form fields.
        </p>
        <span className="font-mono text-xs text-brand-black/40">
          e.g., &quot;5kg of biryani, 30 servings, expiring at 8pm&quot;
        </span>
      </div>

      {/* Side-by-side layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: text input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="nlp-text-input" className="label-text text-brand-black">RAW DESCRIPTION</label>
            <Button
              type="button"
              variant={isListening ? "destructive" : "ghost"}
              size="sm"
              onClick={isListening ? stopVoice : startVoice}
              id="nlp-voice-button"
            >
              {isListening ? "⏹ STOP" : "🎤 VOICE"}
            </Button>
          </div>

          <textarea
            id="nlp-text-input"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (parseState === "done") setParseState("idle");
            }}
            placeholder="Type your food description here, or use the voice button..."
            rows={6}
            className="w-full px-4 py-3 border-2 border-brand-black font-body text-body-sm resize-none focus:outline-none focus:border-brand-red bg-brand-white"
          />

          {isListening && (
            <div className="flex items-center gap-2 font-mono text-xs text-brand-red">
              <span className="inline-block w-2 h-2 bg-brand-red rounded-full animate-pulse" />
              Listening... speak now
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleParse}
              disabled={!text.trim() || parseState === "parsing"}
              id="nlp-parse-button"
            >
              {parseState === "parsing" ? "PARSING…" : "PARSE WITH AI →"}
            </Button>
            {text && (
              <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
                CLEAR
              </Button>
            )}
          </div>
        </div>

        {/* Right: parsed result */}
        <div>
          <div className="label-text text-brand-black mb-2">PARSED FIELDS</div>

          {parseState === "idle" && (
            <div className="border-2 border-dashed border-brand-black/30 p-6 h-full flex items-center justify-center">
              <p className="font-mono text-xs text-brand-black/30 text-center">
                Parsed fields will appear here after you click &quot;Parse with AI&quot;
              </p>
            </div>
          )}

          {parseState === "parsing" && (
            <div className="border-2 border-brand-black p-6 bg-brand-cream space-y-2">
              <div className="w-full bg-brand-black/10 h-1">
                <div className="h-1 bg-brand-red animate-pulse w-3/4" />
              </div>
              <p className="font-mono text-xs text-brand-black/50">Gemini is parsing your description…</p>
            </div>
          )}

          {(parseState === "done" || parseState === "error") && result && (
            <div className="border-2 border-brand-black p-4 bg-brand-cream space-y-3">
              {/* Confidence badge */}
              <div className="flex items-center justify-between">
                <Badge variant={tierBadge(tier)}>
                  {tier.toUpperCase()} — {Math.round(result.confidence_score * 100)}%
                </Badge>
              </div>

              {/* Warning */}
              {result.ai_warning && (
                <div className="border border-brand-red/40 bg-brand-red/5 p-2">
                  <p className="font-mono text-xs text-brand-red font-bold">⚠ {result.ai_warning}</p>
                </div>
              )}

              {/* Parsed fields */}
              <div className="space-y-2">
                {[
                  { label: "TITLE", value: result.title },
                  { label: "CATEGORY", value: result.food_category },
                  { label: "SERVINGS", value: result.estimated_servings?.toString() },
                  { label: "QUANTITY", value: result.quantity_kg ? `${result.quantity_kg} kg` : null },
                  { label: "EXPIRY", value: result.expiry_time ? new Date(result.expiry_time).toLocaleString("en-IN") : null },
                  { label: "ALLERGENS", value: result.allergens?.join(", ") || null },
                  { label: "PACKAGING", value: result.packaging_type },
                  { label: "NOTES", value: result.notes },
                ].filter((f) => f.value).map((f) => (
                  <div key={f.label}>
                    <span className="font-mono text-[10px] text-brand-black/50 uppercase tracking-wide">{f.label}</span>
                    <p className="font-body text-body-sm text-brand-black font-semibold">{f.value}</p>
                  </div>
                ))}

                {/* No fields parsed */}
                {!result.title && !result.food_category && !result.quantity_kg && (
                  <p className="font-mono text-xs text-brand-black/40">
                    No fields could be parsed — please fill in manually
                  </p>
                )}
              </div>

              {/* Apply button */}
              {(result.title || result.food_category || result.quantity_kg) && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleApply}
                  id="nlp-apply-button"
                  className="w-full"
                >
                  ✓ APPLY TO FORM
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

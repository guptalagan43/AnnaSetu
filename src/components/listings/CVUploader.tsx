"use client";

/**
 * CVUploader — Computer Vision food photo intake component (Phase 15)
 *
 * Renders a drag-and-drop zone, uploads to POST /api/ai/cv,
 * and passes the structured CV output back to the parent form via onResult.
 *
 * Follows rules.md §5: if AI fails, always returns a fallback object
 * and never blocks the user from filling in the form manually.
 */

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Badge } from "@/components/ui/Badge";

export interface CVResult {
  food_category: string | null;
  estimated_servings: number | null;
  quantity_kg: number | null;
  confidence_score: number;
  intake_method: "cv";
  photo_url?: string;           // Supabase Storage URL (if upload succeeded)
  ai_warning?: string;
}

interface CVUploaderProps {
  onResult: (result: CVResult) => void;
  onPhotoUrl?: (url: string) => void; // local object URL for preview
}

type ConfidenceTier = "high" | "medium" | "low" | "none";

function getConfidenceTier(score: number): ConfidenceTier {
  if (score >= 0.7) return "high";
  if (score >= 0.5) return "medium";
  if (score > 0) return "low";
  return "none";
}

function confidenceLabel(tier: ConfidenceTier): string {
  const map: Record<ConfidenceTier, string> = {
    high: "HIGH CONFIDENCE",
    medium: "MEDIUM CONFIDENCE",
    low: "LOW CONFIDENCE",
    none: "ANALYSIS FAILED",
  };
  return map[tier];
}

function confidenceBadgeVariant(tier: ConfidenceTier): "success" | "warning" | "caution" | "emergency" {
  const map: Record<ConfidenceTier, "success" | "warning" | "caution" | "emergency"> = {
    high: "success",
    medium: "warning",
    low: "caution",
    none: "emergency",
  };
  return map[tier];
}

export function CVUploader({ onResult, onPhotoUrl }: CVUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<CVResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setError(null);
      setResult(null);

      // Local preview
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      onPhotoUrl?.(objectUrl);

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("image", file);

        const res = await fetch("/api/ai/cv", {
          method: "POST",
          body: formData,
        });

        const json = await res.json();

        // Even if AI fails, /api/ai/cv returns 200 with a fallback — never blocks
        const cvResult: CVResult = json.data ?? {
          food_category: null,
          estimated_servings: null,
          quantity_kg: null,
          confidence_score: 0,
          intake_method: "cv",
          ai_warning: "AI analysis unavailable — please fill in manually",
        };

        setResult(cvResult);
        onResult(cvResult);
        // Prefer the permanent Supabase Storage URL if available
        if (cvResult.photo_url) onPhotoUrl?.(cvResult.photo_url);
      } catch {
        // Network error — still return graceful fallback
        const fallbackResult: CVResult = {
          food_category: null,
          estimated_servings: null,
          quantity_kg: null,
          confidence_score: 0,
          intake_method: "cv",
          ai_warning: "Could not reach AI service — please fill in manually",
        };
        setResult(fallbackResult);
        onResult(fallbackResult);
        setError("Could not reach AI service — you can still fill in the form manually.");
      } finally {
        setUploading(false);
      }
    },
    [onResult, onPhotoUrl]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".heic"] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10 MB
    disabled: uploading,
  });

  const tier = result ? getConfidenceTier(result.confidence_score) : "none";

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        id="cv-uploader-dropzone"
        className={[
          "border-2 border-dashed p-8 text-center cursor-pointer transition-colors",
          isDragActive ? "border-brand-red bg-brand-red/5" : "border-brand-black/40 bg-brand-cream",
          uploading ? "opacity-60 cursor-wait" : "hover:border-brand-black hover:bg-brand-cream/80",
        ].join(" ")}
      >
        <input {...getInputProps()} id="cv-uploader-input" />

        {uploading ? (
          <div className="space-y-3">
            <div className="font-display text-display-sm text-brand-black">ANALYSING PHOTO…</div>
            <div className="w-full bg-brand-black/10 h-1">
              <div className="h-1 bg-brand-red animate-pulse w-2/3" />
            </div>
            <p className="font-body text-body-sm text-brand-black/50">Gemini Vision is processing your food photo</p>
          </div>
        ) : preview ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Food photo preview" className="max-h-48 mx-auto object-contain border-2 border-brand-black" />
            <p className="font-body text-body-sm text-brand-black/60">
              Drop a different photo to re-analyse, or fill in the form below
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-4xl">📷</div>
            <div className="font-display text-display-sm text-brand-black">
              {isDragActive ? "DROP IT HERE" : "UPLOAD FOOD PHOTO"}
            </div>
            <p className="font-body text-body-sm text-brand-black/60">
              Drag & drop or click — JPG, PNG, WEBP, HEIC — max 10 MB
            </p>
            <p className="font-mono text-xs text-brand-black/40 mt-2">
              AI will auto-fill the form fields below
            </p>
          </div>
        )}
      </div>

      {/* Error notice */}
      {error && (
        <div className="border-2 border-brand-red/50 bg-brand-red/5 p-3">
          <p className="font-body text-body-sm text-brand-red">{error}</p>
        </div>
      )}

      {/* CV result card */}
      {result && (
        <div className="border-2 border-brand-black p-4 bg-brand-cream space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-display text-display-sm text-brand-black">AI ANALYSIS RESULT</span>
            <Badge variant={confidenceBadgeVariant(tier)}>
              {confidenceLabel(tier)} — {Math.round(result.confidence_score * 100)}%
            </Badge>
          </div>

          {/* Warning for low confidence */}
          {(result.ai_warning || tier === "low" || tier === "none") && (
            <div className="border border-brand-red/40 bg-brand-red/5 p-3">
              <p className="font-mono text-xs text-brand-red font-bold">
                ⚠ {result.ai_warning || "Low confidence — please verify before confirming"}
              </p>
            </div>
          )}

          {/* Pre-filled fields summary */}
          <div className="grid grid-cols-3 gap-3">
            {result.food_category && (
              <div>
                <p className="label-text text-brand-black/50">CATEGORY</p>
                <p className="font-body text-body-sm text-brand-black font-semibold">{result.food_category}</p>
              </div>
            )}
            {result.estimated_servings !== null && (
              <div>
                <p className="label-text text-brand-black/50">SERVINGS</p>
                <p className="font-body text-body-sm text-brand-black font-semibold">~{result.estimated_servings}</p>
              </div>
            )}
            {result.quantity_kg !== null && (
              <div>
                <p className="label-text text-brand-black/50">WEIGHT</p>
                <p className="font-body text-body-sm text-brand-black font-semibold">~{result.quantity_kg} kg</p>
              </div>
            )}
          </div>

          {result.food_category && (
            <p className="font-mono text-xs text-brand-black/40">
              Fields pre-filled below — Analysed by AI, please verify before confirming
            </p>
          )}
        </div>
      )}
    </div>
  );
}

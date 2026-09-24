"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { toast } from "@/components/ui/Toast";
import {
  FOOD_CATEGORIES,
  PACKAGING_TYPES,
  ALLERGENS,
  type CreateListingInput,
} from "@/lib/validators/listing.schema";
import { CVUploader, type CVResult } from "@/components/listings/CVUploader";
import { NLPParser, type NLPResult } from "@/components/listings/NLPParser";

// Leaflet location picker loaded client-side only
const LocationPicker = dynamic(() => import("@/components/verification/LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 border-2 border-brand-black bg-brand-cream flex items-center justify-center">
      <span className="font-body text-brand-black/50">Loading map…</span>
    </div>
  ),
});

// Format Date to datetime-local input string (YYYY-MM-DDTHH:mm)
function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function NewListingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const relistParam = searchParams.get("relist");

  // Form state
  const [title, setTitle] = useState("");
  const [foodCategory, setFoodCategory] = useState<string>(FOOD_CATEGORIES[2]); // Default: Cooked rice dishes / curries
  const [quantityKg, setQuantityKg] = useState<string>("10");
  const [estimatedServings, setEstimatedServings] = useState<string>("25");
  const [packagingType, setPackagingType] = useState<string>(PACKAGING_TYPES[1]); // Plastic containers / Trays
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [pickupAddress, setPickupAddress] = useState("");
  const [latitude, setLatitude] = useState<number>(12.9716); // Default: Bengaluru
  const [longitude, setLongitude] = useState<number>(77.5946);
  const [notes, setNotes] = useState("");

  // Default times: start now, end in 2 hours, expiry in 4 hours
  const now = new Date();
  const defaultStart = new Date(now.getTime() + 10 * 60 * 1000); // +10 min
  const defaultEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2 hrs
  const defaultExpiry = new Date(now.getTime() + 4 * 60 * 60 * 1000); // +4 hrs

  const [windowStart, setWindowStart] = useState(toDatetimeLocal(defaultStart));
  const [windowEnd, setWindowEnd] = useState(toDatetimeLocal(defaultEnd));
  const [expiryTime, setExpiryTime] = useState(toDatetimeLocal(defaultExpiry));

  // UI state
  const [loading, setLoading] = useState(false);
  const [cvPhotoUrl, setCvPhotoUrl] = useState<string | null>(null);
  const [intakeMethod, setIntakeMethod] = useState<"manual" | "cv" | "nlp">("manual");
  const [lastListingAvailable, setLastListingAvailable] = useState<boolean>(false);
  const [createdListing, setCreatedListing] = useState<{
    id: string;
    donor_pin: string;
    ers_score: number;
    title: string;
  } | null>(null);

  // Fetch verified donor's address and check for previous listings
  useEffect(() => {
    async function loadDonorContext() {
      try {
        const res = await fetch("/api/listings?latest=true");
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setLastListingAvailable(true);
            if (relistParam === "last") {
              applyRelistData(json.data);
            }
          }
        }
      } catch (err) {
        console.error("Failed to check last listing:", err);
      }
    }
    loadDonorContext();
  }, [relistParam]);

  // Apply last listing data for one-click relist
  function applyRelistData(data: {
    title: string;
    food_category: string;
    quantity_kg: number;
    estimated_servings: number;
    packaging_type: string;
    allergens?: string[];
    pickup_address: string;
  }) {
    setTitle(data.title || "");
    if (data.food_category) setFoodCategory(data.food_category);
    if (data.quantity_kg) setQuantityKg(data.quantity_kg.toString());
    if (data.estimated_servings) setEstimatedServings(data.estimated_servings.toString());
    if (data.packaging_type) setPackagingType(data.packaging_type);
    if (Array.isArray(data.allergens)) setSelectedAllergens(data.allergens);
    if (data.pickup_address) {
      // Clean any appended notes from prior address string
      const cleanAddress = data.pickup_address.replace(/\s*\[Notes:.*\]$/, "");
      setPickupAddress(cleanAddress);
    }
    toast.success("Previous listing copied! Verify pickup & expiry times.");
  }

  // Apply NLP result — pre-fills form fields from free-text / voice (Phase 16)
  function handleNLPResult(result: NLPResult) {
    setIntakeMethod("nlp");
    if (result.title) setTitle(result.title);
    if (result.food_category && FOOD_CATEGORIES.includes(result.food_category as typeof FOOD_CATEGORIES[number])) {
      setFoodCategory(result.food_category);
    }
    if (result.estimated_servings !== null && result.estimated_servings > 0) {
      setEstimatedServings(result.estimated_servings.toString());
    }
    if (result.quantity_kg !== null && result.quantity_kg > 0) {
      setQuantityKg(result.quantity_kg.toString());
    }
    if (result.expiry_time) setExpiryTime(toDatetimeLocal(new Date(result.expiry_time)));
    if (result.allergens && result.allergens.length > 0) setSelectedAllergens(result.allergens);
    if (result.packaging_type) setPackagingType(result.packaging_type);
    if (result.notes) setNotes(result.notes);
  }

  // Apply CV analysis result — pre-fills form fields (rules.md §5)
  function handleCVResult(result: CVResult) {
    setIntakeMethod("cv");
    if (result.food_category && FOOD_CATEGORIES.includes(result.food_category as typeof FOOD_CATEGORIES[number])) {
      setFoodCategory(result.food_category);
    }
    if (result.estimated_servings !== null && result.estimated_servings > 0) {
      setEstimatedServings(result.estimated_servings.toString());
    }
    if (result.quantity_kg !== null && result.quantity_kg > 0) {
      setQuantityKg(result.quantity_kg.toString());
    }
  }

  // Handle One-Click Relist button click
  async function handleOneClickRelist() {
    try {
      const res = await fetch("/api/listings?latest=true");
      if (!res.ok) throw new Error("Could not fetch last listing");
      const json = await res.json();
      if (!json.data) {
        toast.error("No previous listings found to copy");
        return;
      }
      applyRelistData(json.data);
    } catch {
      toast.error("Failed to copy last listing");
    }
  }

  // Toggle allergen selection
  function toggleAllergen(item: string) {
    if (item === "None") {
      setSelectedAllergens(["None"]);
      return;
    }
    setSelectedAllergens((prev) => {
      const filtered = prev.filter((a) => a !== "None");
      return filtered.includes(item) ? filtered.filter((a) => a !== item) : [...filtered, item];
    });
  }

  // Quick preset button handler for safe window
  function applyPresetHours(hours: number) {
    const currentStart = new Date(windowStart);
    const newEnd = new Date(currentStart.getTime() + hours * 60 * 60 * 1000);
    const newExpiry = new Date(currentStart.getTime() + (hours + 1) * 60 * 60 * 1000);
    setWindowEnd(toDatetimeLocal(newEnd));
    setExpiryTime(toDatetimeLocal(newExpiry));
    toast.success(`Window set: ${hours} hours from pickup start`);
  }

  // Submit listing
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (!title.trim()) throw new Error("Please enter a food title");
      if (!pickupAddress.trim()) throw new Error("Please enter a pickup address");

      const payload: CreateListingInput = {
        title: title.trim(),
        food_category: foodCategory as CreateListingInput["food_category"],
        quantity_kg: parseFloat(quantityKg),
        estimated_servings: parseInt(estimatedServings, 10),
        packaging_type: packagingType,
        allergens: selectedAllergens,
        pickup_address: pickupAddress.trim(),
        latitude,
        longitude,
        pickup_window_start: new Date(windowStart).toISOString(),
        pickup_window_end: new Date(windowEnd).toISOString(),
        expiry_time: new Date(expiryTime).toISOString(),
        notes: notes.trim() || undefined,
        intake_method: intakeMethod,
        photo_url: cvPhotoUrl ?? undefined,
      };

      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to create listing");
      }

      setCreatedListing({
        id: json.data.id,
        donor_pin: json.data.donor_pin,
        ers_score: json.data.ers_score,
        title: json.data.title,
      });

      toast.success("Food listing is live! Matching has started.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Submission failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  // Success view with PIN and confirmation
  if (createdListing) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-4 border-brand-black bg-brand-cream p-8 text-center space-y-6">
          <div className="inline-block bg-brand-black text-brand-white font-mono text-sm px-4 py-1 uppercase tracking-widest">
            LISTING CONFIRMED & ACTIVE
          </div>

          <h1 className="font-display text-display-xl text-brand-black">
            SURPLUS FOOD POSTED!
          </h1>

          <p className="font-body text-body-lg text-brand-black/80">
            <strong>{createdListing.title}</strong> is now broadcast to nearby shelters.
            Our geo-matching engine and AI dispatcher are finding the best shelter match.
          </p>

          <div className="border-2 border-brand-black bg-brand-white p-6 max-w-sm mx-auto space-y-2">
            <span className="label-text text-brand-black/60">YOUR 4-DIGIT DONOR PIN</span>
            <div className="font-mono text-display-xl font-bold tracking-widest text-brand-red">
              {createdListing.donor_pin}
            </div>
            <p className="font-mono text-xs text-brand-black/60">
              Provide this PIN to the verified driver upon pickup for chain-of-custody verification.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/donor">
              <Button variant="primary" size="lg">GO TO DONOR DASHBOARD →</Button>
            </Link>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                setCreatedListing(null);
                setTitle("");
                setNotes("");
              }}
            >
              + POST ANOTHER LISTING
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-2 border-brand-black pb-6">
        <div>
          <h1 className="font-display text-display-lg text-brand-black">
            POST SURPLUS FOOD
          </h1>
          <p className="font-body text-body-md text-brand-black/70 mt-1">
                      Manual or AI-Assisted Intake — Takes under 60 seconds. Matched automatically.
          </p>
        </div>

        {lastListingAvailable && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleOneClickRelist}
            className="flex items-center gap-2"
          >
            ⚡ ONE-CLICK RELIST (COPY LAST)
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* AI Photo Analysis — CV Intake (Phase 15) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-display-sm text-brand-black">📷 AI PHOTO ANALYSIS</h2>
              <span className="font-mono text-xs bg-brand-black text-brand-white px-2 py-0.5">OPTIONAL</span>
            </div>
            <p className="font-body text-body-sm text-brand-black/60 mt-1">
              Upload a food photo and let Gemini Vision auto-fill the form fields below.
              You can always override any pre-filled value.
            </p>
          </CardHeader>
          <CardContent>
            <CVUploader
              onResult={handleCVResult}
              onPhotoUrl={(url) => setCvPhotoUrl(url)}
            />
          </CardContent>
        </Card>

        {/* AI Text / Voice Analysis — NLP Intake (Phase 16) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <h2 className="font-display text-display-sm text-brand-black">🎤 AI TEXT / VOICE PARSER</h2>
              <span className="font-mono text-xs bg-brand-black text-brand-white px-2 py-0.5">OPTIONAL</span>
            </div>
            <p className="font-body text-body-sm text-brand-black/60 mt-1">
              Type or speak a description like &quot;5kg of biryani expiring at 8pm&quot; and AI will auto-fill the form.
            </p>
          </CardHeader>
          <CardContent>
            <NLPParser onResult={handleNLPResult} />
          </CardContent>
        </Card>

        {/* Section 1: Food Details */}
        <Card>
          <CardHeader>
            <h2 className="font-display text-display-sm text-brand-black">
              1. FOOD DETAILS
            </h2>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input
              label="FOOD ITEM / TITLE *"
              hint="e.g., Vegetable Biryani × 3 Trays, Paneer Butter Masala, Fresh Sliced Melons"
              placeholder="What food are you donating?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label-text block mb-2">FOOD CATEGORY *</label>
                <select
                  value={foodCategory}
                  onChange={(e) => setFoodCategory(e.target.value)}
                  className="input-field w-full px-4 py-3 bg-brand-white border-2 border-brand-black font-body text-body-md"
                  required
                >
                  {FOOD_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <p className="font-mono text-xs text-brand-black/50 mt-1">
                  Determines the baseline Expiry Risk Score (ERS)
                </p>
              </div>

              <div>
                <label className="label-text block mb-2">PACKAGING TYPE *</label>
                <select
                  value={packagingType}
                  onChange={(e) => setPackagingType(e.target.value)}
                  className="input-field w-full px-4 py-3 bg-brand-white border-2 border-brand-black font-body text-body-md"
                  required
                >
                  {PACKAGING_TYPES.map((pkg) => (
                    <option key={pkg} value={pkg}>
                      {pkg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                label="TOTAL WEIGHT (KG) *"
                type="number"
                step="0.5"
                min="0.5"
                max="10000"
                value={quantityKg}
                onChange={(e) => setQuantityKg(e.target.value)}
                required
              />

              <Input
                label="ESTIMATED SERVINGS *"
                type="number"
                min="1"
                max="50000"
                value={estimatedServings}
                onChange={(e) => setEstimatedServings(e.target.value)}
                required
              />
            </div>

            {/* Allergens */}
            <div>
              <label className="label-text block mb-2">CONTAINED ALLERGENS (SELECT ALL THAT APPLY)</label>
              <div className="flex flex-wrap gap-2">
                {ALLERGENS.map((allergen) => {
                  const isSelected = selectedAllergens.includes(allergen);
                  return (
                    <button
                      key={allergen}
                      type="button"
                      onClick={() => toggleAllergen(allergen)}
                      className={`font-mono text-xs px-3 py-1.5 border-2 border-brand-black transition-colors ${
                        isSelected
                          ? "bg-brand-black text-brand-white"
                          : "bg-brand-white text-brand-black hover:bg-brand-cream"
                      }`}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {allergen}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Safe Times & Pickup Window */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h2 className="font-display text-display-sm text-brand-black">
              2. PICKUP WINDOW & EXPIRY
            </h2>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-brand-black/60">QUICK PRESETS:</span>
              <button
                type="button"
                onClick={() => applyPresetHours(2)}
                className="font-mono text-xs px-2 py-1 bg-brand-cream border border-brand-black hover:bg-brand-black hover:text-brand-white"
              >
                +2 HRS
              </button>
              <button
                type="button"
                onClick={() => applyPresetHours(4)}
                className="font-mono text-xs px-2 py-1 bg-brand-cream border border-brand-black hover:bg-brand-black hover:text-brand-white"
              >
                +4 HRS
              </button>
              <button
                type="button"
                onClick={() => applyPresetHours(6)}
                className="font-mono text-xs px-2 py-1 bg-brand-cream border border-brand-black hover:bg-brand-black hover:text-brand-white"
              >
                +6 HRS
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="PICKUP READY FROM *"
                type="datetime-local"
                value={windowStart}
                onChange={(e) => setWindowStart(e.target.value)}
                required
              />

              <Input
                label="PICKUP MUST COMPLETE BY *"
                type="datetime-local"
                value={windowEnd}
                onChange={(e) => setWindowEnd(e.target.value)}
                required
              />

              <Input
                label="STRICT FOOD EXPIRY TIME *"
                type="datetime-local"
                value={expiryTime}
                onChange={(e) => setExpiryTime(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Location */}
        <Card>
          <CardHeader>
            <h2 className="font-display text-display-sm text-brand-black">
              3. PICKUP LOCATION & INSTRUCTIONS
            </h2>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input
              label="PICKUP ADDRESS *"
              hint="Exact pickup address where driver will collect food"
              placeholder="e.g. 104 MG Road, Ground Floor Kitchen Entrance"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              required
            />

            <div>
              <label className="label-text block mb-2">PINPOINT ON MAP (CLICK TO POSITION PIN)</label>
              <LocationPicker
                lat={latitude}
                lng={longitude}
                onPick={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
              />
              <p className="font-mono text-xs text-brand-black/60 mt-2">
                Coords: {latitude.toFixed(6)}, {longitude.toFixed(6)} — used for PostGIS nearest-shelter matching
              </p>
            </div>

            <Input
              label="OPTIONAL PICKUP NOTES"
              hint="Access codes, gate instructions, parking instructions (max 500 chars)"
              placeholder="e.g. Ring service bell at back gate, ask for chef Ramesh"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
            />
          </CardContent>
        </Card>

        {/* Form Submission */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-t-2 border-brand-black pt-6">
          <Link href="/donor">
            <Button type="button" variant="ghost">← CANCEL</Button>
          </Link>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? "CREATING & BROADCASTING…" : "CONFIRM & POST LISTING →"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewListingPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center font-mono">
          Loading listing form…
        </div>
      }
    >
      <NewListingContent />
    </Suspense>
  );
}

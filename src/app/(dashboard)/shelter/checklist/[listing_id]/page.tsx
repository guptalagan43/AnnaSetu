"use client";

import * as React from "react";
import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { ERSBadge } from "@/components/ui/ERSBadge";

interface ListingDetails {
  id: string;
  title: string;
  food_category: string;
  quantity_kg: number;
  estimated_servings?: number;
  pickup_address: string;
  status: string;
  ers_score?: number;
  donor_pin?: string;
  donor?: {
    business_name?: string;
    full_name?: string;
    phone?: string;
  };
  driver?: {
    full_name?: string;
    phone?: string;
    vehicle_type?: string;
  };
}

export default function ShelterChecklistPage({
  params,
}: {
  params: Promise<{ listing_id: string }>;
}) {
  const { listing_id } = use(params);
  const router = useRouter();

  const [listing, setListing] = useState<ListingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<{
    type: "success" | "warning";
    text: string;
  } | null>(null);

  // 5 Checklist Items State
  const [quantityOk, setQuantityOk] = useState<boolean>(true);
  const [itemCorrect, setItemCorrect] = useState<boolean>(true);
  const [packagingOk, setPackagingOk] = useState<boolean>(true);
  const [foodConditionOk, setFoodConditionOk] = useState<boolean>(true);
  const [donorPin, setDonorPin] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [discrepancyType, setDiscrepancyType] = useState<string>("unspecified");

  // Fetch listing details
  useEffect(() => {
    async function loadListing() {
      try {
        setIsLoading(true);
        // Fetch from API matches or listings
        const res = await fetch(`/api/listings`);
        if (res.ok) {
          const json = await res.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const found = (json.data || []).find((l: any) => l.id === listing_id);
          if (found) {
            setListing({
              id: found.id,
              title: found.title,
              food_category: found.food_category,
              quantity_kg: Number(found.quantity_kg) || 0,
              estimated_servings: found.estimated_servings,
              pickup_address: found.pickup_address,
              status: found.status,
              ers_score: found.ers_score,
              donor_pin: found.donor_pin,
              donor: {
                business_name: "Verified Food Donor",
                phone: "+91 98765 43210",
              },
            });
            setIsLoading(false);
            return;
          }
        }

        // Fallback / default demonstration listing
        setListing({
          id: listing_id,
          title: "Freshly Cooked Meals (Paneer Curry, Rice & Rotis)",
          food_category: "cooked_meals",
          quantity_kg: 24.5,
          estimated_servings: 50,
          pickup_address: "The Oberoi, MG Road, Bengaluru",
          status: "in_transit",
          ers_score: 76,
          donor_pin: "4821",
          donor: {
            business_name: "The Oberoi Bengaluru",
            phone: "+91 98450 11223",
          },
          driver: {
            full_name: "Priya Sharma (Volunteer)",
            vehicle_type: "Electric Scooter",
            phone: "+91 98765 43210",
          },
        });
      } catch (err) {
        console.warn("[Checklist] Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadListing();
  }, [listing_id]);

  const allPhysicalChecksPassed =
    quantityOk && itemCorrect && packagingOk && foodConditionOk;

  const isPinComplete = donorPin.trim().length === 4;
  const isAllChecksPassed = allPhysicalChecksPassed && isPinComplete;

  const handleSubmit = async (overrideOutcome?: "reject") => {
    setError(null);
    setResultMessage(null);

    // If any physical check is false or override is reject, ensure notes has at least 10 chars
    const isRejection = overrideOutcome === "reject" || !allPhysicalChecksPassed;
    if (isRejection && (!notes || notes.trim().length < 10)) {
      setError("Detailed inspection notes (minimum 10 characters) are required when reporting an issue.");
      return;
    }

    if (!donorPin || donorPin.trim().length !== 4) {
      setError("4-digit Donor PIN must be entered for verification.");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        listing_id,
        quantity_ok: overrideOutcome === "reject" ? false : quantityOk,
        item_correct: overrideOutcome === "reject" ? false : itemCorrect,
        packaging_ok: overrideOutcome === "reject" ? false : packagingOk,
        food_condition_ok: overrideOutcome === "reject" ? false : foodConditionOk,
        donor_pin: donorPin.trim(),
        notes: notes.trim(),
        discrepancy_type: discrepancyType,
      };

      const res = await fetch("/api/delivery-receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit checklist");
      }

      if (data.checklist_passed) {
        setResultMessage({
          type: "success",
          text: "✅ DELIVERY ACCEPTED! Official receipt recorded and impact added to shelter log.",
        });
        setTimeout(() => {
          router.push("/shelter");
        }, 3000);
      } else {
        setResultMessage({
          type: "warning",
          text: `⚠️ DISCREPANCY RECORDED: ${data.message}`,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error submitting checklist");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center font-mono text-sm text-brand-black/60 border-4 border-brand-black bg-brand-white max-w-3xl mx-auto">
        LOADING FOOD INSPECTION CHECKLIST...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <header className="border-b-4 border-brand-black pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/shelter"
            className="font-mono text-xs font-bold text-brand-black uppercase underline hover:text-brand-red"
          >
            ← BACK TO SHELTER DASHBOARD
          </Link>
          <Badge variant="warning" className="font-mono text-xs">
            FOOD SAFETY INSPECTION
          </Badge>
        </div>
        <h1 className="font-display text-display-lg text-brand-black uppercase font-black tracking-tight mt-1">
          DELIVERY ACCEPTANCE CHECKLIST
        </h1>
        <p className="font-mono text-xs text-brand-black/70">
          5-Point Physical Inspection & 4-Digit Donor PIN Verification (SRS §13 & FR-CHECK-01)
        </p>
      </header>

      {/* Result / Error Notification */}
      {resultMessage && (
        <div
          className={`p-4 border-4 border-brand-black shadow-brutal font-mono text-sm font-bold ${
            resultMessage.type === "success"
              ? "bg-ers-safe/20 text-brand-black border-ers-safe"
              : "bg-brand-yellow/30 text-brand-black"
          }`}
        >
          {resultMessage.text}
          {resultMessage.type === "success" && (
            <span className="block text-xs font-normal mt-1">Redirecting to shelter dashboard in 3 seconds...</span>
          )}
        </div>
      )}

      {error && (
        <div className="p-4 border-4 border-brand-red bg-brand-red/10 text-brand-red font-mono text-sm font-bold shadow-brutal">
          {error}
        </div>
      )}

      {/* Listing Overview Card */}
      {listing && (
        <Card className="border-4 border-brand-black shadow-brutal bg-brand-cream/60">
          <CardHeader className="p-4 bg-brand-white border-b-2 border-brand-black flex flex-row items-center justify-between">
            <div>
              <span className="label-text text-[10px] text-brand-black/60">DONATION DETAILS</span>
              <h3 className="font-display text-base font-black text-brand-black uppercase">
                {listing.title}
              </h3>
            </div>
            {listing.ers_score ? <ERSBadge score={listing.ers_score} size="sm" /> : null}
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
            <div>
              <span className="text-brand-black/60 block">EXPECTED QUANTITY</span>
              <strong className="text-sm text-brand-black">{listing.quantity_kg} kg</strong>
              {listing.estimated_servings ? (
                <span className="text-brand-black/60 block">({listing.estimated_servings} servings)</span>
              ) : null}
            </div>
            <div>
              <span className="text-brand-black/60 block">CATEGORY</span>
              <strong className="text-sm text-brand-black uppercase">
                {listing.food_category.replace(/_/g, " ")}
              </strong>
            </div>
            <div>
              <span className="text-brand-black/60 block">DONOR</span>
              <strong className="text-sm text-brand-black">
                {listing.donor?.business_name || "Food Donor"}
              </strong>
            </div>
            <div>
              <span className="text-brand-black/60 block">DELIVERED BY</span>
              <strong className="text-sm text-brand-black">
                {listing.driver?.full_name || "Volunteer Driver"}
              </strong>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 5-Point Checklist Form */}
      <Card className="border-4 border-brand-black shadow-brutal bg-brand-white">
        <CardHeader className="p-4 bg-brand-black text-brand-white border-b-2 border-brand-black flex flex-row items-center justify-between">
          <h2 className="font-display text-base font-black uppercase tracking-wider">
            5-POINT VERIFICATION PROTOCOL
          </h2>
          <span className="font-mono text-xs font-bold text-brand-yellow">
            ALL 5 ITEMS REQUIRED TO PASS
          </span>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Check Item 1 */}
          <div className="p-4 border-2 border-brand-black flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-brand-cream/20">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-black text-white font-mono text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <span className="font-display text-sm font-black uppercase text-brand-black">
                  QUANTITY ACCURATE & SUFFICIENT
                </span>
              </div>
              <p className="font-mono text-xs text-brand-black/60 mt-1 pl-8">
                Weight matches manifest (~{listing?.quantity_kg} kg). Variance is ≤ 10%.
              </p>
            </div>
            <div className="flex items-center gap-2 pl-8 sm:pl-0">
              <Button
                type="button"
                variant={quantityOk ? "primary" : "ghost"}
                size="sm"
                onClick={() => setQuantityOk(true)}
                className="font-mono text-xs font-bold"
              >
                PASS ✅
              </Button>
              <Button
                type="button"
                variant={!quantityOk ? "secondary" : "ghost"}
                size="sm"
                onClick={() => {
                  setQuantityOk(false);
                  setDiscrepancyType("quantity_mismatch");
                }}
                className="font-mono text-xs font-bold"
              >
                ISSUE ❌
              </Button>
            </div>
          </div>

          {/* Check Item 2 */}
          <div className="p-4 border-2 border-brand-black flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-brand-cream/20">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-black text-white font-mono text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <span className="font-display text-sm font-black uppercase text-brand-black">
                  CORRECT FOOD ITEMS
                </span>
              </div>
              <p className="font-mono text-xs text-brand-black/60 mt-1 pl-8">
                Items delivered match listing description ({listing?.food_category.replace(/_/g, " ")}).
              </p>
            </div>
            <div className="flex items-center gap-2 pl-8 sm:pl-0">
              <Button
                type="button"
                variant={itemCorrect ? "primary" : "ghost"}
                size="sm"
                onClick={() => setItemCorrect(true)}
                className="font-mono text-xs font-bold"
              >
                PASS ✅
              </Button>
              <Button
                type="button"
                variant={!itemCorrect ? "secondary" : "ghost"}
                size="sm"
                onClick={() => {
                  setItemCorrect(false);
                  setDiscrepancyType("wrong_items");
                }}
                className="font-mono text-xs font-bold"
              >
                ISSUE ❌
              </Button>
            </div>
          </div>

          {/* Check Item 3 */}
          <div className="p-4 border-2 border-brand-black flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-brand-cream/20">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-black text-white font-mono text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <span className="font-display text-sm font-black uppercase text-brand-black">
                  PACKAGING INTACT & HYGIENIC
                </span>
              </div>
              <p className="font-mono text-xs text-brand-black/60 mt-1 pl-8">
                Containers are clean, sealed, free of leaks, pests, or transit contamination.
              </p>
            </div>
            <div className="flex items-center gap-2 pl-8 sm:pl-0">
              <Button
                type="button"
                variant={packagingOk ? "primary" : "ghost"}
                size="sm"
                onClick={() => setPackagingOk(true)}
                className="font-mono text-xs font-bold"
              >
                PASS ✅
              </Button>
              <Button
                type="button"
                variant={!packagingOk ? "secondary" : "ghost"}
                size="sm"
                onClick={() => {
                  setPackagingOk(false);
                  setDiscrepancyType("packaging_damaged");
                }}
                className="font-mono text-xs font-bold"
              >
                ISSUE ❌
              </Button>
            </div>
          </div>

          {/* Check Item 4 */}
          <div className="p-4 border-2 border-brand-black flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-brand-cream/20">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-black text-white font-mono text-xs font-bold flex items-center justify-center">
                  4
                </span>
                <span className="font-display text-sm font-black uppercase text-brand-black">
                  FOOD CONDITION & TEMPERATURE SAFE
                </span>
              </div>
              <p className="font-mono text-xs text-brand-black/60 mt-1 pl-8">
                Food has normal smell, fresh appearance, and is kept at a safe holding temperature.
              </p>
            </div>
            <div className="flex items-center gap-2 pl-8 sm:pl-0">
              <Button
                type="button"
                variant={foodConditionOk ? "primary" : "ghost"}
                size="sm"
                onClick={() => setFoodConditionOk(true)}
                className="font-mono text-xs font-bold"
              >
                PASS ✅
              </Button>
              <Button
                type="button"
                variant={!foodConditionOk ? "secondary" : "ghost"}
                size="sm"
                onClick={() => {
                  setFoodConditionOk(false);
                  setDiscrepancyType("food_unsafe");
                }}
                className="font-mono text-xs font-bold"
              >
                ISSUE ❌
              </Button>
            </div>
          </div>

          {/* Check Item 5: 4-Digit Donor PIN */}
          <div className="p-5 border-3 border-brand-black bg-brand-cream/40">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-brand-red text-white font-mono text-xs font-bold flex items-center justify-center">
                5
              </span>
              <span className="font-display text-sm font-black uppercase text-brand-black">
                4-DIGIT DONOR PIN CONFIRMATION
              </span>
            </div>
            <p className="font-mono text-xs text-brand-black/70 mb-3 pl-8">
              Ask the volunteer driver or donor for the confidential 4-digit code generated when the run was dispatched.
            </p>

            <div className="pl-8 max-w-xs">
              <Input
                type="text"
                maxLength={4}
                placeholder="4-DIGIT PIN"
                value={donorPin}
                onChange={(e) => setDonorPin(e.target.value.replace(/\D/g, ""))}
                className="font-mono text-xl tracking-[0.5em] text-center font-black border-3 border-brand-black bg-brand-white"
              />
              <span className="font-mono text-[11px] text-brand-black/60 block mt-1">
                {donorPin.length === 4 ? "4 digits entered ●" : "Enter 4 digits from donor"}
              </span>
            </div>
          </div>

          {/* Discrepancy Details & Notes (Visible or Required if any issue) */}
          <div className="space-y-3 pt-2">
            {!allPhysicalChecksPassed ? (
              <div className="p-4 border-2 border-brand-red bg-brand-red/5 space-y-2">
                <span className="font-display text-xs font-bold uppercase text-brand-red">
                  ⚠️ ISSUE IDENTIFIED — SELECT DISCREPANCY TYPE:
                </span>
                <select
                  value={discrepancyType}
                  onChange={(e) => setDiscrepancyType(e.target.value)}
                  className="w-full p-2 border-2 border-brand-black font-mono text-xs font-bold bg-brand-white"
                >
                  <option value="quantity_mismatch">Quantity Mismatch (&gt; 10% discrepancy)</option>
                  <option value="wrong_items">Wrong Items / Category Mismatch</option>
                  <option value="packaging_damaged">Packaging Damaged or Contaminated</option>
                  <option value="food_unsafe">Food Unsafe / Spoilage / Temperature Failure</option>
                  <option value="multiple">Multiple Quality Issues</option>
                  <option value="other">Other Issue</option>
                </select>
              </div>
            ) : null}

            <div>
              <label className="font-display text-xs font-black uppercase text-brand-black block mb-1">
                INSPECTION NOTES {!allPhysicalChecksPassed && <span className="text-brand-red">* (REQUIRED: MIN 10 CHARS)</span>}
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  !allPhysicalChecksPassed
                    ? "Provide specific observations regarding the discrepancy for administrative and safety review..."
                    : "Optional notes regarding food temperature, serving plan, or storage condition..."
                }
                className="w-full p-3 border-2 border-brand-black font-mono text-xs bg-brand-white focus:outline-none focus:ring-2 focus:ring-brand-black"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t-2 border-brand-black flex flex-col sm:flex-row gap-4">
            <Button
              type="button"
              variant="primary"
              size="lg"
              onClick={() => handleSubmit()}
              disabled={isSubmitting || !isAllChecksPassed}
              className={`flex-1 font-display text-base font-black tracking-wider py-4 ${
                isAllChecksPassed ? "bg-ers-safe border-brand-black hover:bg-ers-safe/90" : "opacity-60"
              }`}
            >
              {isSubmitting ? "RECORDING..." : "ACCEPT DELIVERY & CONFIRM RECEIPT ✅"}
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => handleSubmit("reject")}
              disabled={isSubmitting}
              className="font-display text-sm font-black tracking-wider py-4 border-2 border-brand-red text-brand-red hover:bg-brand-red/10"
            >
              REJECT / FLAG DISPUTE ❌
            </Button>
          </div>

          <div className="text-center font-mono text-[11px] text-brand-black/60">
            Accepting initiates instant donor tax receipt generation and ESG carbon reduction accounting.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

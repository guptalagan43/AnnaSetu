"use client";

import * as React from "react";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ERSBadge } from "@/components/ui/ERSBadge";
import { Modal } from "@/components/ui/Modal";

export interface MatchListingData {
  id: string;
  title: string;
  food_category: string;
  quantity_kg: number;
  estimated_servings?: number;
  pickup_address: string;
  pickup_window_start?: string;
  pickup_window_end?: string;
  expiry_time: string;
  ers_score: number;
  status: string;
  donor_name?: string;
  donor_verified?: boolean;
}

export interface MatchShelterData {
  id: string;
  name: string;
  capacity_kg: number;
  current_load_kg: number;
}

export interface MatchRecord {
  id: string;
  listing_id: string;
  shelter_id: string;
  match_score?: number;
  distance_km?: number;
  status: "pending" | "accepted" | "declined" | "auto_confirmed";
  auto_confirmed?: boolean;
  created_at?: string;
  listings?: MatchListingData | null;
  shelters?: MatchShelterData | null;
}

interface MatchCardProps {
  match: MatchRecord;
  availableCapacityKg: number;
  onAccept: (matchId: string) => Promise<void>;
  onDecline: (matchId: string, reason: string) => Promise<void>;
}

const COMMON_DECLINE_REASONS = [
  "Shelter is currently at maximum capacity",
  "Cannot accommodate or store this food type",
  "Pickup location is beyond transport range",
  "Insufficient staff or volunteers available today",
  "Operating hours already closed for meal intake",
];

export function MatchCard({
  match,
  availableCapacityKg,
  onAccept,
  onDecline,
}: MatchCardProps) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(COMMON_DECLINE_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [isSubmittingDecline, setIsSubmittingDecline] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const listing = match.listings;
  if (!listing) return null;

  const quantityKg = Number(listing.quantity_kg || 0);
  const servings = listing.estimated_servings ?? Math.round(quantityKg * 2.5);
  const ersScore = Number(listing.ers_score || 0);
  const distance = match.distance_km ? `${Number(match.distance_km).toFixed(1)} km` : "Nearby";

  // Capacity fit calculation
  const fitsCapacity = availableCapacityKg >= quantityKg;

  // Format expiry / window countdown
  const expiryDate = new Date(listing.expiry_time);
  const now = new Date();
  const diffMs = expiryDate.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));
  const timeLeftDisplay =
    diffMs <= 0
      ? "EXPIRED"
      : diffHours > 0
      ? `${diffHours}h ${diffMins}m left`
      : `${diffMins} min left`;

  const handleAcceptClick = async () => {
    try {
      setIsAccepting(true);
      setErrorMsg(null);
      await onAccept(match.id);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to accept match");
      setIsAccepting(false);
    }
  };

  const handleDeclineSubmit = async () => {
    const finalReason = customReason.trim() ? customReason.trim() : selectedReason;
    if (!finalReason) {
      setErrorMsg("Please select or enter a reason for declining.");
      return;
    }

    try {
      setIsSubmittingDecline(true);
      setErrorMsg(null);
      await onDecline(match.id, finalReason);
      setIsDeclineModalOpen(false);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to decline match");
    } finally {
      setIsSubmittingDecline(false);
    }
  };

  return (
    <>
      <Card className="border-4 border-brand-black shadow-brutal transition-all hover:translate-x-0.5 hover:translate-y-0.5">
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 bg-brand-red/10 border-2 border-brand-red p-3 text-brand-red font-mono text-sm font-bold">
              ⚠️ {errorMsg}
            </div>
          )}

          {match.auto_confirmed && (
            <div className="mb-4 bg-brand-yellow/30 border-2 border-brand-black p-2 font-mono text-xs font-bold flex items-center justify-between">
              <span>⚡ AUTO-MATCHED BY AGENTIC DISPATCHER</span>
              <span className="text-brand-black/60">Auto-confirmed</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Column 1: Food Details & Urgency */}
            <div className="lg:col-span-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-display-sm text-brand-black font-extrabold uppercase tracking-tight">
                  {listing.title}
                </h3>
                <ERSBadge score={ersScore} size="sm" />
              </div>

              <div className="font-mono text-xs text-brand-black/70 space-y-0.5">
                <p>
                  <strong>Donor:</strong> {listing.donor_name || "Verified Food Partner"} ⭐
                </p>
                <p>
                  <strong>Distance:</strong> {distance} away · ⏱ <strong>{timeLeftDisplay}</strong>
                </p>
                <p className="truncate text-brand-black/60">
                  📍 {listing.pickup_address}
                </p>
              </div>
            </div>

            {/* Column 2: Quantity & Category */}
            <div className="lg:col-span-3 space-y-2">
              <div>
                <span className="label-text text-brand-black/60 block text-[10px]">QUANTITY</span>
                <span className="font-display font-black text-xl text-brand-black">
                  {quantityKg} kg
                </span>
                <span className="font-mono text-xs text-brand-black/60 ml-2">
                  (~{servings} servings)
                </span>
              </div>

              <div>
                <span className="label-text text-brand-black/60 block text-[10px]">CATEGORY</span>
                <span className="font-mono text-xs font-bold uppercase text-brand-black">
                  {listing.food_category.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            {/* Column 3: Capacity Fit Indicator */}
            <div className="lg:col-span-2">
              <span className="label-text text-brand-black/60 block text-[10px] mb-1">
                CAPACITY FIT
              </span>
              <Badge variant={fitsCapacity ? "safe" : "warning"} className="font-mono text-xs py-1">
                {fitsCapacity ? "✅ FITS CAPACITY" : "⚠️ MAY EXCEED"}
              </Badge>
              <p className="font-mono text-[10px] text-brand-black/60 mt-1">
                {fitsCapacity
                  ? `${quantityKg} kg / ${availableCapacityKg.toFixed(0)} kg available`
                  : `Needs ${quantityKg} kg (${availableCapacityKg.toFixed(0)} kg free)`}
              </p>
            </div>

            {/* Column 4: Accept / Decline Action Buttons */}
            <div className="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col gap-2 justify-end">
              {match.status === "pending" || match.status === "auto_confirmed" ? (
                <>
                  <Button
                    variant="primary"
                    onClick={handleAcceptClick}
                    disabled={isAccepting}
                    className="w-full justify-center font-bold tracking-wider"
                  >
                    {isAccepting ? "ACCEPTING..." : "✅ ACCEPT"}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setIsDeclineModalOpen(true)}
                    disabled={isAccepting}
                    className="w-full justify-center border-2 border-brand-black hover:bg-brand-red/10"
                  >
                    ❌ DECLINE
                  </Button>
                </>
              ) : (
                <div className="text-right">
                  <Badge variant={match.status === "accepted" ? "safe" : "default"}>
                    {match.status.toUpperCase()}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Decline Reason Modal */}
      <Modal
        isOpen={isDeclineModalOpen}
        onClose={() => setIsDeclineModalOpen(false)}
        title="DECLINE DONATION MATCH"
        description={`Provide a reason for declining "${listing.title}". This triggers immediate automatic re-matching to the next available shelter.`}
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button
              variant="ghost"
              onClick={() => setIsDeclineModalOpen(false)}
              disabled={isSubmittingDecline}
            >
              CANCEL
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeclineSubmit}
              disabled={isSubmittingDecline}
            >
              {isSubmittingDecline ? "DECLINING..." : "CONFIRM & RE-MATCH"}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 py-2 font-mono text-sm">
          <p className="font-bold text-brand-black">Select Primary Reason:</p>
          <div className="space-y-2">
            {COMMON_DECLINE_REASONS.map((reason) => (
              <label
                key={reason}
                className="flex items-center gap-3 p-2 border-2 border-brand-black/20 bg-brand-white cursor-pointer hover:border-brand-black"
              >
                <input
                  type="radio"
                  name="declineReason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="accent-brand-red w-4 h-4"
                />
                <span className="text-xs text-brand-black">{reason}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-black mb-1">
              OR SPECIFY OTHER REASON:
            </label>
            <textarea
              rows={2}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="e.g. Storage freezer under emergency maintenance..."
              className="input-field w-full text-xs font-mono p-2"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}

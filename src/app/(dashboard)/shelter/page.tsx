"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ERSBadge } from "@/components/ui/ERSBadge";
import { MatchCard, MatchRecord } from "@/components/matches/MatchCard";
import Link from "next/link";

interface ShelterProfile {
  id: string;
  name: string;
  address: string;
  capacity_kg: number;
  current_load_kg: number;
  available_capacity_kg: number;
  status: "active" | "unavailable" | "suspended";
  food_preferences: string[];
  food_restrictions: string[];
}

export default function ShelterDashboard() {
  const [shelter, setShelter] = useState<ShelterProfile | null>(null);
  const [incomingMatches, setIncomingMatches] = useState<MatchRecord[]>([]);
  const [scheduledMatches, setScheduledMatches] = useState<MatchRecord[]>([]);
  const [sortBy, setSortBy] = useState<"ers" | "distance">("ers");
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "info" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "info" | "error" = "info") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      // 1. Fetch Shelter Info
      const shelterRes = await fetch("/api/shelter");
      let shelterData: ShelterProfile = {
        id: "shelter-default",
        name: "Hope Community Shelter",
        address: "123 Hope Way, Indiranagar, Bengaluru",
        capacity_kg: 100,
        current_load_kg: 45,
        available_capacity_kg: 55,
        status: "active",
        food_preferences: ["Cooked rice dishes / curries", "Baked goods / bread", "Packaged / sealed foods"],
        food_restrictions: ["No expired food"],
      };

      if (shelterRes.ok) {
        const json = await shelterRes.json();
        if (json.data) shelterData = json.data;
      }
      setShelter(shelterData);

      // 2. Fetch Incoming (Pending & Auto-confirmed) Matches
      const pendingRes = await fetch("/api/matches?status=pending");
      if (pendingRes.ok) {
        const json = await pendingRes.json();
        const matches: MatchRecord[] = json.data || [];
        setIncomingMatches(matches);
      }

      // 3. Fetch Scheduled (Accepted) Matches
      const acceptedRes = await fetch("/api/matches?status=accepted");
      if (acceptedRes.ok) {
        const json = await acceptedRes.json();
        const matches: MatchRecord[] = json.data || [];
        setScheduledMatches(matches);
      }
    } catch (err) {
      console.error("[Shelter Dashboard] Error loading data:", err);
      showToast("Failed to load dashboard data. Retrying...", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Auto-poll every 30 seconds for live updates (FR-MATCH-01)
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Handle Match Accept
  const handleAcceptMatch = async (matchId: string) => {
    const res = await fetch(`/api/matches/${matchId}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to accept match");
    }

    showToast("🎉 Match accepted! Listing marked as matched and donor notified.", "success");
    // Reload data to move to scheduled
    await loadData();
  };

  // Handle Match Decline
  const handleDeclineMatch = async (matchId: string, reason: string) => {
    const res = await fetch(`/api/matches/${matchId}/decline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to decline match");
    }

    showToast("Match declined. Geo-matching engine initiated re-matching cascade.", "info");
    // Reload data
    await loadData();
  };

  // Quick Toggle Availability
  const handleToggleAvailability = async () => {
    if (!shelter) return;
    const newStatus = shelter.status === "active" ? "unavailable" : "active";

    try {
      const res = await fetch("/api/shelter", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      const json = await res.json();
      setShelter(json.data);
      showToast(
        newStatus === "unavailable"
          ? "Shelter marked unavailable today. Incoming matches paused."
          : "Shelter marked active. You will now receive incoming matches.",
        "info"
      );
    } catch {
      showToast("Failed to update shelter status.", "error");
    }
  };

  // Sort incoming matches
  const sortedIncoming = [...incomingMatches].sort((a, b) => {
    if (sortBy === "ers") {
      const ersA = a.listings?.ers_score ?? 0;
      const ersB = b.listings?.ers_score ?? 0;
      return ersB - ersA; // Highest ERS first
    } else {
      const distA = a.distance_km ?? 999;
      const distB = b.distance_km ?? 999;
      return distA - distB; // Closest first
    }
  });

  const capacityKg = Number(shelter?.capacity_kg || 100);
  const currentLoadKg = Number(shelter?.current_load_kg || 0);
  const availableKg = shelter?.available_capacity_kg ?? Math.max(0, capacityKg - currentLoadKg);
  const utilizationPct = capacityKg > 0 ? Math.min(100, Math.round((currentLoadKg / capacityKg) * 100)) : 0;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Toast Banner */}
      {toastMessage && (
        <div
          className={`p-4 border-3 font-mono text-sm font-bold flex items-center justify-between shadow-brutal-sm ${
            toastMessage.type === "success"
              ? "bg-ers-safe/20 border-ers-safe text-brand-black"
              : toastMessage.type === "error"
              ? "bg-brand-red/10 border-brand-red text-brand-red"
              : "bg-brand-yellow/30 border-brand-black text-brand-black"
          }`}
        >
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-xs uppercase underline ml-4"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b-4 border-brand-black pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-display-lg text-brand-black uppercase font-black tracking-tight">
              {shelter?.name || "COMMUNITY SHELTER"}
            </h1>
            <Badge variant="safe" className="font-mono">
              VERIFIED ✅
            </Badge>
          </div>
          <p className="font-mono text-sm text-brand-black/70 mt-1">
            📍 {shelter?.address || "Indiranagar, Bengaluru"} · Storage Available:{" "}
            <strong>{availableKg.toFixed(0)}/{capacityKg} kg free</strong>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/shelter/capacity">
            <Button variant="primary">UPDATE CAPACITY</Button>
          </Link>
          <Link href="/shelter/capacity">
            <Button variant="secondary">SET PREFERENCES</Button>
          </Link>
          <Button
            variant={shelter?.status === "unavailable" ? "primary" : "ghost"}
            onClick={handleToggleAvailability}
            className="border-2 border-brand-black"
          >
            {shelter?.status === "unavailable" ? "GO ONLINE (ACTIVE)" : "MARK UNAVAILABLE"}
          </Button>
        </div>
      </header>

      {/* Live Capacity Bar */}
      <Card className="border-4 border-brand-black shadow-brutal">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="label-text text-brand-black font-extrabold text-sm">
                STORAGE CAPACITY STATUS
              </span>
              <Badge variant={shelter?.status === "active" ? "safe" : "warning"}>
                {shelter?.status === "active" ? "ONLINE" : "PAUSED"}
              </Badge>
            </div>
            <span className="font-mono text-sm font-bold text-brand-black">
              {availableKg.toFixed(0)} / {capacityKg} kg free ({utilizationPct}% utilized)
            </span>
          </div>

          <div className="w-full h-8 bg-brand-black/10 border-2 border-brand-black relative overflow-hidden">
            <div
              className={`h-full transition-all ${
                utilizationPct > 80 ? "bg-brand-red" : utilizationPct > 50 ? "bg-brand-yellow" : "bg-ers-safe"
              }`}
              style={{ width: `${utilizationPct}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-black">
              <span className={utilizationPct > 50 ? "text-brand-white" : "text-brand-black"}>
                {availableKg.toFixed(0)} KG AVAILABLE FOR RESCUE
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incoming Donations Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-brand-black pb-2">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-display-md text-brand-black uppercase font-black">
              INCOMING DONATION MATCHES
            </h2>
            <Badge variant="warning" className="font-mono text-xs">
              {incomingMatches.length} ACTIVE
            </Badge>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <span className="text-brand-black/60 font-bold">SORT BY:</span>
            <button
              onClick={() => setSortBy("ers")}
              className={`px-3 py-1 border-2 border-brand-black font-bold uppercase transition-all ${
                sortBy === "ers" ? "bg-brand-black text-brand-white" : "bg-brand-white text-brand-black"
              }`}
            >
              ERS RISK ↓
            </button>
            <button
              onClick={() => setSortBy("distance")}
              className={`px-3 py-1 border-2 border-brand-black font-bold uppercase transition-all ${
                sortBy === "distance" ? "bg-brand-black text-brand-white" : "bg-brand-white text-brand-black"
              }`}
            >
              DISTANCE ↑
            </button>
          </div>
        </div>

        {isLoading && incomingMatches.length === 0 ? (
          <div className="p-8 text-center font-mono text-sm text-brand-black/60 border-2 border-dashed border-brand-black/20">
            CHECKING FOR NEW INCOMING MATCHES...
          </div>
        ) : sortedIncoming.length === 0 ? (
          <Card className="border-4 border-brand-black shadow-brutal p-8 text-center bg-brand-cream/50">
            <p className="font-display text-lg font-bold text-brand-black uppercase">
              NO PENDING MATCHES RIGHT NOW
            </p>
            <p className="font-mono text-xs text-brand-black/60 mt-1 max-w-md mx-auto">
              Our autonomous geo-matching engine continuously searches for surplus food within 15 km of your shelter.
              New matches will appear here automatically.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedIncoming.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                availableCapacityKg={availableKg}
                onAccept={handleAcceptMatch}
                onDecline={handleDeclineMatch}
              />
            ))}
          </div>
        )}
      </section>

      {/* Scheduled Deliveries Section */}
      <section className="space-y-4 pt-4">
        <div className="border-b-2 border-brand-black pb-2">
          <h2 className="font-display text-display-md text-brand-black uppercase font-black">
            SCHEDULED — ACCEPTED & AWAITING DELIVERY
          </h2>
          <p className="font-mono text-xs text-brand-black/60">
            Matched rescue runs currently in driver assignment, pickup, or transit.
          </p>
        </div>

        {scheduledMatches.length === 0 ? (
          <Card className="border-2 border-brand-black/30 p-6 text-center bg-brand-white">
            <p className="font-mono text-xs text-brand-black/60">
              No accepted deliveries scheduled today. Accept an incoming match above to initiate driver dispatch.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scheduledMatches.map((match) => {
              const listing = match.listings;
              return (
                <Card key={match.id} className="border-3 border-brand-black shadow-brutal-sm p-4 bg-brand-white">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-display text-sm font-black text-brand-black uppercase">
                        {listing?.title || "Food Item"}
                      </h4>
                      <p className="font-mono text-xs text-brand-black/60">
                        {listing?.quantity_kg || 0} kg · {listing?.food_category?.replace(/_/g, " ") || "Prepared Food"}
                      </p>
                    </div>
                    <Badge variant="safe" className="font-mono text-[10px]">
                      ACCEPTED
                    </Badge>
                  </div>

                  <div className="font-mono text-xs text-brand-black/80 space-y-1 border-t border-brand-black/10 pt-2 mt-2">
                    <p>📍 <strong>Pickup:</strong> {listing?.pickup_address || "Specified Location"}</p>
                    <p>⏱ <strong>Status:</strong> {listing?.status?.toUpperCase() || "MATCHED"}</p>
                  </div>

                  {listing?.id ? (
                    <Link href={`/shelter/checklist/${listing.id}`}>
                      <Button variant="secondary" size="sm" className="w-full mt-3 font-mono text-xs font-bold border-2 border-brand-black">
                        OPEN DELIVERY CHECKLIST 📋
                      </Button>
                    </Link>
                  ) : null}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Food Preferences & Dietary Overview */}
      <Card className="border-4 border-brand-black shadow-brutal">
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-display-md text-brand-black uppercase font-extrabold">
              ACTIVE FOOD PREFERENCES & RESTRICTIONS
            </h2>
            <Link href="/shelter/capacity">
              <Button variant="ghost" size="sm" className="border-2 border-brand-black">
                EDIT PREFERENCES
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="label-text text-brand-black/60 text-xs block mb-2">
              ACCEPTED CATEGORIES:
            </span>
            <div className="flex flex-wrap gap-2">
              {shelter?.food_preferences && shelter.food_preferences.length > 0 ? (
                shelter.food_preferences.map((pref) => (
                  <Badge key={pref} variant="safe" className="font-mono text-xs">
                    ✅ {pref.toUpperCase()}
                  </Badge>
                ))
              ) : (
                <span className="font-mono text-xs text-brand-black/60">All standard categories accepted</span>
              )}
            </div>
          </div>

          <div>
            <span className="label-text text-brand-black/60 text-xs block mb-2">
              HARD RESTRICTIONS / EXCLUSIONS:
            </span>
            <div className="flex flex-wrap gap-2">
              {shelter?.food_restrictions && shelter.food_restrictions.length > 0 ? (
                shelter.food_restrictions.map((rest) => (
                  <Badge key={rest} variant="critical" className="font-mono text-xs">
                    🚫 {rest.toUpperCase()}
                  </Badge>
                ))
              ) : (
                <span className="font-mono text-xs text-brand-black/60">No dietary exclusions registered</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* This Week's Impact Summary (SRS §15.2) */}
      <Card className="border-4 border-brand-black shadow-brutal bg-brand-cream/30">
        <CardHeader>
          <h2 className="font-display text-display-md text-brand-black uppercase font-extrabold">
            THIS WEEK'S RESCUE IMPACT
          </h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="bg-brand-white p-4 border-2 border-brand-black">
              <div className="font-display text-display-xl text-brand-red font-black">
                890
              </div>
              <div className="label-text text-brand-black/60 text-xs mt-1">
                MEALS SERVED FROM RESCUED FOOD
              </div>
            </div>

            <div className="bg-brand-white p-4 border-2 border-brand-black">
              <div className="font-display text-display-xl text-brand-black font-black">
                356 kg
              </div>
              <div className="label-text text-brand-black/60 text-xs mt-1">
                TOTAL SURPLUS FOOD DIVERTED
              </div>
            </div>

            <div className="bg-brand-white p-4 border-2 border-brand-black">
              <div className="font-display text-display-md text-brand-red font-black mt-2">
                MG ROAD DHABA
              </div>
              <div className="label-text text-brand-black/60 text-xs mt-1">
                TOP DONOR (18 RESCUES)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
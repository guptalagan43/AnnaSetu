"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { ERSBadge } from "@/components/ui/ERSBadge";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

interface DriverAssignment {
  id: string;
  driver_id: string;
  listing_id: string;
  status: "assigned" | "picked_up" | "delivered";
  picked_up_at?: string;
  delivered_at?: string;
  listings?: {
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
    donor_pin?: string;
    matches?: {
      id: string;
      shelters?: {
        id: string;
        name: string;
        address: string;
      };
    }[];
  };
}

interface DriverProfile {
  id: string;
  vehicle_type: string;
  is_available: boolean;
  reliability_score?: number;
  profiles?: {
    full_name: string;
    phone: string;
    email: string;
  };
}

export default function DriverDashboard() {
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [assignments, setAssignments] = useState<DriverAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<Record<string, boolean>>({});
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // 1. Fetch current driver profile
      const driverRes = await fetch("/api/drivers?self=true");
      let driverData: DriverProfile = {
        id: "driver-default",
        vehicle_type: "bike",
        is_available: true,
        reliability_score: 0.98,
        profiles: {
          full_name: "Priya Sharma",
          phone: "+91 98765 43210",
          email: "driver@annasetu.in",
        },
      };

      if (driverRes.ok) {
        const json = await driverRes.json();
        if (json.data) driverData = json.data;
      }
      setDriver(driverData);

      // 2. Fetch driver's active assignments
      const assignRes = await fetch("/api/driver-assignments");
      if (assignRes.ok) {
        const json = await assignRes.json();
        setAssignments(json.data || []);
      }
    } catch (err) {
      console.error("[Driver Dashboard] Error:", err);
      showToast("Could not load driver data.", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // 30s live poll
    return () => clearInterval(interval);
  }, [loadData]);

  // Toggle Online/Offline
  const handleToggleAvailability = async () => {
    try {
      setIsTogglingAvailability(true);
      const res = await fetch("/api/drivers/availability", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update availability");

      setDriver((prev) => (prev ? { ...prev, is_available: data.is_available } : null));
      showToast(data.message, "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error updating status", "error");
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  // Mark Picked Up
  const handleMarkPickedUp = async (assignmentId: string) => {
    try {
      setIsUpdatingStatus((prev) => ({ ...prev, [assignmentId]: true }));

      const res = await fetch(`/api/driver-assignments/${assignmentId}/pickup`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to mark picked up");

      showToast("📦 Pickup confirmed! Listing status advanced to in_transit.", "success");
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error confirming pickup", "error");
    } finally {
      setIsUpdatingStatus((prev) => ({ ...prev, [assignmentId]: false }));
    }
  };

  // Mark Delivered
  const handleMarkDelivered = async (assignmentId: string) => {
    try {
      setIsUpdatingStatus((prev) => ({ ...prev, [assignmentId]: true }));

      const res = await fetch(`/api/driver-assignments/${assignmentId}/deliver`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to mark delivered");

      showToast("🏠 Delivery arrived! Status advanced to checklist.", "success");
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error confirming delivery", "error");
    } finally {
      setIsUpdatingStatus((prev) => ({ ...prev, [assignmentId]: false }));
    }
  };

  const activeAssignments = assignments.filter(
    (a) => a.status === "assigned" || a.status === "picked_up"
  );
  const completedAssignments = assignments.filter((a) => a.status === "delivered");

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`p-4 border-3 font-mono text-sm font-bold flex items-center justify-between ${
            toast.type === "success"
              ? "bg-ers-safe/20 border-ers-safe text-brand-black"
              : toast.type === "error"
              ? "bg-brand-red/10 border-brand-red text-brand-red"
              : "bg-brand-yellow/30 border-brand-black text-brand-black"
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="underline text-xs ml-4">
            DISMISS
          </button>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b-4 border-brand-black pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-display-lg text-brand-black uppercase font-black tracking-tight">
              {driver?.profiles?.full_name || "VOLUNTEER DRIVER"}
            </h1>
            <Badge
              variant={driver?.is_available ? "safe" : "default"}
              className="font-mono text-xs"
            >
              {driver?.is_available ? "ONLINE ●" : "OFFLINE ○"}
            </Badge>
          </div>
          <p className="font-mono text-xs text-brand-black/70 mt-1">
            Vehicle: <strong>{driver?.vehicle_type?.toUpperCase() || "BIKE"}</strong> · Phone:{" "}
            <strong>{driver?.profiles?.phone || "+91 98765 43210"}</strong>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant={driver?.is_available ? "secondary" : "primary"}
            onClick={handleToggleAvailability}
            disabled={isTogglingAvailability}
            className="font-bold tracking-wider"
          >
            {driver?.is_available ? "GO OFFLINE" : "GO ONLINE (AVAILABLE)"}
          </Button>
          <Link href="/register/driver">
            <Button variant="ghost" className="border-2 border-brand-black text-xs">
              UPDATE VEHICLE
            </Button>
          </Link>
        </div>
      </header>

      {/* Active Assignments / Route */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b-2 border-brand-black pb-2">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-display-md text-brand-black uppercase font-black">
              ACTIVE RESCUE ASSIGNMENTS
            </h2>
            <Badge variant="warning" className="font-mono text-xs">
              {activeAssignments.length} ACTIVE
            </Badge>
          </div>
          <span className="font-mono text-xs text-brand-black/60 font-bold">
            PIPELINE: MATCHED → ASSIGNED → IN TRANSIT → CHECKLIST
          </span>
        </div>

        {isLoading && assignments.length === 0 ? (
          <div className="p-8 text-center font-mono text-sm text-brand-black/60">
            CHECKING FOR ASSIGNED RESCUE RUNS...
          </div>
        ) : activeAssignments.length === 0 ? (
          <Card className="border-4 border-brand-black shadow-brutal p-8 text-center bg-brand-white">
            <p className="font-display font-bold text-lg text-brand-black uppercase">
              NO ACTIVE PICKUPS ASSIGNED
            </p>
            <p className="font-mono text-xs text-brand-black/60 mt-1 max-w-md mx-auto">
              Stay in "ONLINE" status to receive autonomous rescue dispatch assignments.
              When a shelter accepts a match, our dispatcher will allocate the run to you.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {activeAssignments.map((assignment) => {
              const listing = assignment.listings;
              if (!listing) return null;

              const shelter = listing.matches?.[0]?.shelters;
              const shelterName = shelter?.name || "Matched Shelter";
              const shelterAddress = shelter?.address || "Shelter Delivery Location";
              const isPickedUp = assignment.status === "picked_up";

              const navPickupUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                listing.pickup_address
              )}`;
              const navShelterUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                shelterAddress
              )}`;

              return (
                <Card
                  key={assignment.id}
                  className="border-4 border-brand-black shadow-brutal overflow-hidden bg-brand-white"
                >
                  <CardHeader className="bg-brand-cream border-b-2 border-brand-black p-4 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-display text-base font-black text-brand-black uppercase">
                        {listing.title} ({listing.quantity_kg} kg)
                      </h3>
                      <ERSBadge score={listing.ers_score} size="sm" />
                    </div>
                    <Badge variant={isPickedUp ? "caution" : "warning"} className="font-mono text-xs">
                      {isPickedUp ? "IN TRANSIT" : "ASSIGNED"}
                    </Badge>
                  </CardHeader>

                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Stop 1: Pickup */}
                      <div
                        className={`p-4 border-3 transition-all ${
                          isPickedUp
                            ? "border-ers-safe/50 bg-ers-safe/10 opacity-75"
                            : "border-brand-black bg-brand-white shadow-brutal-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs font-black uppercase text-brand-red">
                            {isPickedUp ? "✓ STOP 1: PICKED UP" : "▶ STOP 1: PICKUP"}
                          </span>
                          <a
                            href={navPickupUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs font-bold underline hover:text-brand-red"
                          >
                            NAVIGATE 🗺️
                          </a>
                        </div>
                        <p className="font-mono text-xs text-brand-black font-bold mb-1">
                          📍 {listing.pickup_address}
                        </p>
                        <p className="font-mono text-xs text-brand-black/60 mb-4">
                          Collect: {listing.title} ({listing.food_category.replace(/_/g, " ")}) · {listing.quantity_kg} kg
                        </p>

                        {!isPickedUp ? (
                          <div className="space-y-2 pt-2 border-t border-brand-black/10">
                            <Button
                              variant="primary"
                              onClick={() => handleMarkPickedUp(assignment.id)}
                              disabled={isUpdatingStatus[assignment.id]}
                              className="w-full justify-center font-bold tracking-wider"
                            >
                              {isUpdatingStatus[assignment.id]
                                ? "CONFIRMING..."
                                : "MARK PICKED UP ✅"}
                            </Button>
                            <span className="font-mono text-[10px] text-brand-black/60 block text-center">
                              Tap once food is securely collected from the donor.
                            </span>
                          </div>
                        ) : (
                          <div className="font-mono text-xs font-bold text-ers-safe">
                            Collected at {assignment.picked_up_at ? new Date(assignment.picked_up_at).toLocaleTimeString() : "recently"}
                          </div>
                        )}
                      </div>

                      {/* Stop 2: Delivery */}
                      <div
                        className={`p-4 border-3 transition-all ${
                          isPickedUp
                            ? "border-brand-black bg-brand-white shadow-brutal-sm"
                            : "border-brand-black/30 bg-brand-cream/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-xs font-black uppercase text-brand-black">
                            {isPickedUp ? "▶ STOP 2: DELIVER" : "STOP 2: SHELTER DESTINATION"}
                          </span>
                          <a
                            href={navShelterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-xs font-bold underline hover:text-brand-red"
                          >
                            NAVIGATE 🗺️
                          </a>
                        </div>
                        <p className="font-mono text-xs text-brand-black font-bold mb-1">
                          🏠 {shelterName}
                        </p>
                        <p className="font-mono text-xs text-brand-black/60 mb-4">
                          📍 {shelterAddress}
                        </p>

                        {isPickedUp ? (
                          <div className="space-y-2 pt-2 border-t border-brand-black/10">
                            <Button
                              variant="primary"
                              onClick={() => handleMarkDelivered(assignment.id)}
                              disabled={isUpdatingStatus[assignment.id]}
                              className="w-full justify-center font-bold tracking-wider"
                            >
                              {isUpdatingStatus[assignment.id]
                                ? "CONFIRMING..."
                                : "MARK DELIVERED (OPEN CHECKLIST) ✅"}
                            </Button>
                            <span className="font-mono text-[10px] text-brand-black/60 block text-center">
                              Arrived at shelter — initiates inspection checklist.
                            </span>
                          </div>
                        ) : (
                          <div className="font-mono text-xs text-brand-black/50 italic">
                            Complete Stop 1 pickup to activate shelter delivery confirmation.
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Completed Runs Section */}
      {completedAssignments.length > 0 && (
        <section className="space-y-4 pt-4 border-t-2 border-brand-black">
          <h2 className="font-display text-display-md text-brand-black uppercase font-black">
            RECENTLY COMPLETED DELIVERIES
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {completedAssignments.slice(0, 6).map((ca) => (
              <Card key={ca.id} className="border-2 border-brand-black p-4 bg-brand-white">
                <div className="flex justify-between items-start">
                  <h4 className="font-display text-sm font-bold text-brand-black uppercase">
                    {ca.listings?.title || "Food Item"}
                  </h4>
                  <Badge variant="safe" className="font-mono text-[10px]">
                    DELIVERED
                  </Badge>
                </div>
                <p className="font-mono text-xs text-brand-black/60 mt-1">
                  {ca.listings?.quantity_kg || 0} kg delivered to{" "}
                  {ca.listings?.matches?.[0]?.shelters?.name || "Shelter"}
                </p>
                <p className="font-mono text-[10px] text-brand-black/50 mt-2">
                  Completed {ca.delivered_at ? new Date(ca.delivered_at).toLocaleTimeString() : ""}
                </p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Driver Stats */}
      <section className="border-4 border-brand-black shadow-brutal p-6 bg-brand-cream/50">
        <h2 className="font-display text-display-md text-brand-black uppercase font-black mb-4">
          VOLUNTEER DRIVER PERFORMANCE
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="bg-brand-white p-4 border-2 border-brand-black">
            <div className="font-display text-display-xl text-brand-red font-black">
              {completedAssignments.length + 28}
            </div>
            <div className="label-text text-brand-black/60 text-xs mt-1">TOTAL RESCUE RUNS</div>
          </div>
          <div className="bg-brand-white p-4 border-2 border-brand-black">
            <div className="font-display text-display-xl text-brand-black font-black">
              480
            </div>
            <div className="label-text text-brand-black/60 text-xs mt-1">MEALS TRANSPORTED</div>
          </div>
          <div className="bg-brand-white p-4 border-2 border-brand-black">
            <div className="font-display text-display-xl text-brand-red font-black">
              4.9/5
            </div>
            <div className="label-text text-brand-black/60 text-xs mt-1">RELIABILITY SCORE</div>
          </div>
          <div className="bg-brand-white p-4 border-2 border-brand-black">
            <div className="font-display text-display-xl text-brand-black font-black">
              #1
            </div>
            <div className="label-text text-brand-black/60 text-xs mt-1">CITY RANKING</div>
          </div>
        </div>
      </section>
    </div>
  );
}
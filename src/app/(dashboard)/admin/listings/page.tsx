"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ERSBadge } from "@/components/ui/ERSBadge";
import Link from "next/link";

interface ListingItem {
  id: string;
  title: string;
  food_category: string;
  quantity_kg: number;
  pickup_address: string;
  ers_score: number;
  status: string;
  donor_id: string;
  matches?: {
    id: string;
    shelter_id: string;
    status: string;
    shelters?: {
      id: string;
      name: string;
      address: string;
    };
  }[];
}

interface DriverItem {
  id: string;
  vehicle_type: string;
  is_available: boolean;
  profiles?: {
    id: string;
    full_name: string;
    phone: string;
    email: string;
  };
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // 1. Fetch listings
      const listingsRes = await fetch("/api/listings");
      if (listingsRes.ok) {
        const json = await listingsRes.json();
        setListings(json.data || []);
      }

      // 2. Fetch available drivers
      const driversRes = await fetch("/api/drivers");
      if (driversRes.ok) {
        const json = await driversRes.json();
        setDrivers(json.data || []);
      }
    } catch (err) {
      console.error("[Admin Listings] Error:", err);
      showToast("Failed to load listings data.", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAssignDriver = async (listingId: string) => {
    const driverId = selectedDrivers[listingId];
    if (!driverId) {
      showToast("Please select an available driver first.", "error");
      return;
    }

    try {
      setIsAssigning((prev) => ({ ...prev, [listingId]: true }));

      const res = await fetch("/api/driver-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driver_id: driverId,
          listing_id: listingId,
          assigned_by: "admin",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to assign driver");
      }

      showToast("Driver assigned successfully! Email notifications dispatched.", "success");
      await loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error assigning driver", "error");
    } finally {
      setIsAssigning((prev) => ({ ...prev, [listingId]: false }));
    }
  };

  const filteredListings = listings.filter((l) => {
    if (statusFilter === "ALL") return true;
    return l.status.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-4 border-brand-black pb-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="font-mono text-xs font-bold text-brand-black/60 hover:text-brand-black underline"
            >
              ← BACK TO ADMIN
            </Link>
          </div>
          <h1 className="font-display text-display-lg text-brand-black uppercase font-black tracking-tight mt-1">
            DONATION LISTINGS & DRIVER DISPATCH
          </h1>
          <p className="font-mono text-sm text-brand-black/70">
            Monitor surplus food pipeline status and assign volunteer drivers to matched rescue runs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={loadData}>
            🔄 REFRESH
          </Button>
        </div>
      </div>

      {toast && (
        <div
          className={`p-4 border-3 font-mono text-sm font-bold flex items-center justify-between ${
            toast.type === "success"
              ? "bg-ers-safe/20 border-ers-safe text-brand-black"
              : "bg-brand-red/10 border-brand-red text-brand-red"
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="underline text-xs">
            DISMISS
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 font-mono text-xs">
        {["ALL", "MATCHED", "DRIVER_ASSIGNED", "IN_TRANSIT", "CHECKLIST", "DELIVERED"].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2 border-2 border-brand-black font-bold uppercase transition-all ${
              statusFilter === tab
                ? "bg-brand-black text-brand-white shadow-brutal-sm"
                : "bg-brand-white text-brand-black hover:bg-brand-cream"
            }`}
          >
            {tab.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Listings Table / Cards */}
      {isLoading ? (
        <div className="p-8 text-center font-mono text-sm text-brand-black/60">
          LOADING LISTINGS...
        </div>
      ) : filteredListings.length === 0 ? (
        <Card className="border-4 border-brand-black shadow-brutal p-8 text-center bg-brand-white">
          <p className="font-display font-bold text-lg text-brand-black uppercase">
            NO LISTINGS FOUND IN THIS CATEGORY
          </p>
          <p className="font-mono text-xs text-brand-black/60 mt-1">
            Change your filter or wait for donors to create new surplus food listings.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredListings.map((listing) => {
            const match = listing.matches?.[0];
            const shelterName = match?.shelters?.name || "Matched Shelter";
            const shelterAddress = match?.shelters?.address || "";
            const isAssignable = ["matched", "listed"].includes(listing.status.toLowerCase());

            return (
              <Card
                key={listing.id}
                className="border-4 border-brand-black shadow-brutal p-6 bg-brand-white"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Left Column: Details */}
                  <div className="lg:col-span-5 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-display-sm text-brand-black uppercase font-black">
                        {listing.title}
                      </h3>
                      <ERSBadge score={listing.ers_score} size="sm" />
                      <Badge variant="default" className="font-mono text-[10px]">
                        {listing.status.toUpperCase()}
                      </Badge>
                    </div>

                    <p className="font-mono text-xs text-brand-black/70">
                      <strong>Category:</strong> {listing.food_category.replace(/_/g, " ")} ·{" "}
                      <strong>Quantity:</strong> {listing.quantity_kg} kg
                    </p>
                    <p className="font-mono text-xs text-brand-black/60 truncate">
                      📍 <strong>Pickup:</strong> {listing.pickup_address}
                    </p>
                    {shelterName && (
                      <p className="font-mono text-xs text-brand-red truncate">
                        🏠 <strong>Destination:</strong> {shelterName} ({shelterAddress})
                      </p>
                    )}
                  </div>

                  {/* Middle Column: Status Pipeline View */}
                  <div className="lg:col-span-3">
                    <span className="label-text text-brand-black/60 text-[10px] block mb-1">
                      DISPATCH PIPELINE
                    </span>
                    <div className="font-mono text-xs font-bold space-y-1">
                      <p className={listing.status === "matched" ? "text-brand-red font-black" : "text-brand-black/50"}>
                        {listing.status === "matched" ? "▶ Awaiting Driver Assignment" : "✓ Match Accepted"}
                      </p>
                      <p className={listing.status === "driver_assigned" ? "text-brand-red font-black" : "text-brand-black/50"}>
                        {listing.status === "driver_assigned" ? "▶ Driver Assigned / En Route" : "• Driver Dispatched"}
                      </p>
                      <p className={listing.status === "in_transit" ? "text-brand-red font-black" : "text-brand-black/50"}>
                        {listing.status === "in_transit" ? "▶ In Transit to Shelter" : "• Delivery Transit"}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Driver Assignment Controls */}
                  <div className="lg:col-span-4">
                    {isAssignable ? (
                      <div className="space-y-2 bg-brand-cream/50 p-3 border-2 border-brand-black">
                        <label className="label-text text-brand-black text-[10px] block">
                          ASSIGN AVAILABLE DRIVER:
                        </label>
                        <select
                          value={selectedDrivers[listing.id] || ""}
                          onChange={(e) =>
                            setSelectedDrivers((prev) => ({
                              ...prev,
                              [listing.id]: e.target.value,
                            }))
                          }
                          className="input-field w-full text-xs font-mono py-1.5"
                        >
                          <option value="">-- Choose Volunteer Driver --</option>
                          {drivers.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.profiles?.full_name || "Volunteer"} ({d.vehicle_type.toUpperCase()}) -{" "}
                              {d.is_available ? "ONLINE" : "OFFLINE"}
                            </option>
                          ))}
                        </select>

                        <Button
                          variant="primary"
                          onClick={() => handleAssignDriver(listing.id)}
                          disabled={isAssigning[listing.id] || !selectedDrivers[listing.id]}
                          className="w-full justify-center text-xs font-bold tracking-wider"
                        >
                          {isAssigning[listing.id] ? "DISPATCHING..." : "DISPATCH DRIVER →"}
                        </Button>
                      </div>
                    ) : (
                      <div className="p-3 bg-brand-black/5 border border-brand-black/20 text-center font-mono text-xs text-brand-black/70">
                        Driver already dispatched or completed.
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

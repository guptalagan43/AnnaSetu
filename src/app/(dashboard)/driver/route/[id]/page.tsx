"use client";

import * as React from "react";
import { useState, useEffect, useCallback, use } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ERSBadge } from "@/components/ui/ERSBadge";
import { RouteStop } from "@/lib/routing/osrm";

// Dynamically import Leaflet RouteMap with SSR disabled
const RouteMap = dynamic(() => import("@/components/routing/RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[450px] border-4 border-brand-black bg-brand-cream/40 flex items-center justify-center font-mono text-sm text-brand-black/70 animate-pulse">
      LOADING RESCUE ROUTE MAP...
    </div>
  ),
});

interface RouteResponse {
  success: boolean;
  driver_id: string;
  driver_name: string;
  vehicle_type: string;
  start_location: { latitude: number; longitude: number };
  total_stops: number;
  total_distance_km: number;
  total_duration_minutes: number;
  route_geometry: [number, number][];
  stops: RouteStop[];
  fallback_used: boolean;
}

export default function DriverRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [driverGps, setDriverGps] = useState<{ lat: number; lng: number } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // 1. Detect driver real-time GPS if available
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDriverGps({
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
          });
        },
        (err) => {
          console.warn("[DriverRoute] Geolocation denied or unavailable:", err.message);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // 2. Fetch route data
  const fetchRoute = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let url = `/api/drivers/${id}/route`;
      if (driverGps) {
        url += `?lat=${driverGps.lat}&lng=${driverGps.lng}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load optimized route");
      }

      setRouteData(data);
      if (data.stops?.length > 0 && !selectedStopId) {
        setSelectedStopId(data.stops[0].id);
      }
    } catch (err) {
      console.error("[DriverRoute] Fetch error:", err);
      setError(err instanceof Error ? err.message : "Error loading route");
    } finally {
      setIsLoading(false);
    }
  }, [id, driverGps, selectedStopId]);

  useEffect(() => {
    fetchRoute();
  }, [fetchRoute]);

  // Handle Mark Picked Up
  const handleMarkPickedUp = async (assignmentId: string, stopId: string) => {
    try {
      setIsUpdatingStatus((prev) => ({ ...prev, [stopId]: true }));
      const res = await fetch(`/api/driver-assignments/${assignmentId}/pickup`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to mark picked up");

      showToast("📦 Pickup confirmed! Listing status updated to in_transit.");
      await fetchRoute();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error confirming pickup", "error");
    } finally {
      setIsUpdatingStatus((prev) => ({ ...prev, [stopId]: false }));
    }
  };

  // Handle Mark Delivered
  const handleMarkDelivered = async (assignmentId: string, stopId: string) => {
    try {
      setIsUpdatingStatus((prev) => ({ ...prev, [stopId]: true }));
      const res = await fetch(`/api/driver-assignments/${assignmentId}/deliver`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to mark delivered");

      showToast("🏠 Arrived at shelter! Food inspection checklist opened.");
      await fetchRoute();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Error confirming delivery", "error");
    } finally {
      setIsUpdatingStatus((prev) => ({ ...prev, [stopId]: false }));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-4 border-3 font-mono text-sm font-bold flex items-center justify-between ${
            toast.type === "success"
              ? "bg-ers-safe/20 border-ers-safe text-brand-black"
              : "bg-brand-red/10 border-brand-red text-brand-red"
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="underline text-xs ml-4">
            DISMISS
          </button>
        </div>
      )}

      {/* Header & Navigation */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-4 border-brand-black pb-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/driver"
              className="font-mono text-xs font-bold text-brand-black uppercase underline hover:text-brand-red"
            >
              ← BACK TO DASHBOARD
            </Link>
            <Badge variant="caution" className="font-mono text-xs">
              MULTI-STOP ROUTE OPTIMIZATION
            </Badge>
          </div>
          <h1 className="font-display text-display-lg text-brand-black uppercase font-black tracking-tight mt-1">
            ACTIVE RESCUE RUN ROUTE
          </h1>
          <p className="font-mono text-xs text-brand-black/70">
            Sequenced using OSRM road distance matrix · Pickup-first & ERS-urgency constraints active
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={fetchRoute}
            disabled={isLoading}
            className="font-mono text-xs font-bold"
          >
            {isLoading ? "RECALCULATING..." : "REFRESH ROUTE 🔄"}
          </Button>
          <Link href="/driver">
            <Button variant="primary" className="font-mono text-xs font-bold">
              VIEW ALL RUNS
            </Button>
          </Link>
        </div>
      </header>

      {/* Route Metrics Banner */}
      {routeData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 border-4 border-brand-black bg-brand-cream/50 shadow-brutal">
          <div>
            <span className="label-text text-brand-black/60 text-xs">TOTAL STOPS</span>
            <p className="font-display text-display-md text-brand-black font-black">
              {routeData.total_stops} STOPS
            </p>
          </div>
          <div>
            <span className="label-text text-brand-black/60 text-xs">ESTIMATED DISTANCE</span>
            <p className="font-display text-display-md text-brand-black font-black">
              {routeData.total_distance_km} KM
            </p>
          </div>
          <div>
            <span className="label-text text-brand-black/60 text-xs">ESTIMATED TIME</span>
            <p className="font-display text-display-md text-brand-red font-black">
              ~{routeData.total_duration_minutes} MINS
            </p>
          </div>
          <div>
            <span className="label-text text-brand-black/60 text-xs">ROUTING ENGINE</span>
            <p className="font-display text-base text-brand-black font-black mt-1">
              {routeData.fallback_used ? "HAVERSINE (OFFLINE)" : "OSRM DRIVING MATRIX"}
            </p>
          </div>
        </div>
      )}

      {error ? (
        <Card className="border-4 border-brand-red p-6 text-center bg-brand-red/5">
          <p className="font-display font-bold text-lg text-brand-red uppercase">
            FAILED TO COMPUTE ROUTE
          </p>
          <p className="font-mono text-xs text-brand-black/70 mt-2">{error}</p>
          <Button variant="secondary" onClick={fetchRoute} className="mt-4 font-mono text-xs">
            TRY AGAIN
          </Button>
        </Card>
      ) : isLoading && !routeData ? (
        <div className="p-12 text-center font-mono text-sm text-brand-black/60 border-4 border-brand-black bg-brand-white">
          OPTIMIZING MULTI-STOP WAYPOINTS...
        </div>
      ) : routeData ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Numbered Stop Cards */}
          <div className="lg:col-span-5 space-y-4 max-h-[750px] overflow-y-auto pr-2">
            <h2 className="font-display text-display-sm text-brand-black uppercase font-black sticky top-0 bg-brand-cream py-2 border-b-2 border-brand-black z-10 flex items-center justify-between">
              <span>WAYPOINTS IN SEQUENCE</span>
              <span className="font-mono text-xs font-bold text-brand-black/60">
                {routeData.stops.length} STOPS
              </span>
            </h2>

            {routeData.stops.map((stop, idx) => {
              const isSelected = selectedStopId === stop.id;
              const isPickup = stop.type === "pickup";
              const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                stop.address
              )}`;

              return (
                <Card
                  key={stop.id}
                  onClick={() => setSelectedStopId(stop.id)}
                  className={`border-3 transition-all cursor-pointer ${
                    isSelected
                      ? "border-brand-black ring-4 ring-brand-black bg-brand-white shadow-brutal"
                      : "border-brand-black/60 bg-brand-white/80 hover:border-brand-black"
                  }`}
                >
                  <CardHeader className="p-3 bg-brand-cream/80 border-b-2 border-brand-black flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-black text-white ${
                          isPickup ? "bg-brand-red" : "bg-brand-black"
                        }`}
                      >
                        {stop.stop_number ?? idx + 1}
                      </span>
                      <span className="font-display text-xs font-bold uppercase tracking-wider text-brand-black">
                        {isPickup ? "📦 PICKUP STOP" : "🏠 DELIVERY STOP"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {stop.ers_score ? (
                        <ERSBadge score={stop.ers_score} size="sm" />
                      ) : null}
                      <span className="font-mono text-xs font-black text-brand-black">
                        ETA: {stop.eta_time || `${stop.eta_minutes}m`}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h4 className="font-display text-sm font-black text-brand-black uppercase">
                        {stop.name}
                      </h4>
                      <p className="font-mono text-xs text-brand-black/70 mt-0.5">
                        📍 {stop.address}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-brand-black/60 pt-2 border-t border-brand-black/10">
                      <span>
                        Leg: <strong>{stop.distance_from_previous_km ?? 0} km</strong>
                      </span>
                      {stop.quantity_kg ? (
                        <span>
                          Quantity: <strong>{stop.quantity_kg} kg</strong>
                        </span>
                      ) : null}
                      {stop.donor_pin && isPickup ? (
                        <span className="font-bold text-brand-red">
                          PIN: {stop.donor_pin}
                        </span>
                      ) : null}
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={navUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-center bg-brand-black text-brand-white font-mono text-xs font-bold py-2 px-3 border-2 border-brand-black hover:bg-brand-red transition-colors"
                      >
                        NAVIGATE 🗺️
                      </a>

                      {stop.assignment_id && isPickup && stop.status !== "in_transit" ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (stop.assignment_id) {
                              handleMarkPickedUp(stop.assignment_id, stop.id);
                            }
                          }}
                          disabled={isUpdatingStatus[stop.id]}
                          className="font-mono text-xs font-bold"
                        >
                          {isUpdatingStatus[stop.id] ? "SAVING..." : "PICKED UP ✅"}
                        </Button>
                      ) : stop.assignment_id && !isPickup ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (stop.assignment_id) {
                              handleMarkDelivered(stop.assignment_id, stop.id);
                            }
                          }}
                          disabled={isUpdatingStatus[stop.id]}
                          className="font-mono text-xs font-bold"
                        >
                          {isUpdatingStatus[stop.id] ? "SAVING..." : "DELIVERED 🏠"}
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Right Column: Interactive Map */}
          <div className="lg:col-span-7 sticky top-6">
            <div className="border-4 border-brand-black bg-brand-white p-3 shadow-brutal space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-display text-sm font-black text-brand-black uppercase">
                  ROAD TOPOLOGY & WAYPOINTS
                </span>
                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="flex items-center gap-1 font-bold">
                    <span className="w-3 h-3 rounded-full bg-blue-600 inline-block border border-black" />
                    YOU
                  </span>
                  <span className="flex items-center gap-1 font-bold">
                    <span className="w-3 h-3 rounded-full bg-red-600 inline-block border border-black" />
                    PICKUP
                  </span>
                  <span className="flex items-center gap-1 font-bold">
                    <span className="w-3 h-3 rounded-full bg-black inline-block border border-black" />
                    DELIVERY
                  </span>
                </div>
              </div>

              <div className="h-[550px] w-full">
                <RouteMap
                  stops={routeData.stops}
                  startLocation={routeData.start_location}
                  routeGeometry={routeData.route_geometry}
                  selectedStopId={selectedStopId}
                  onSelectStop={(s) => setSelectedStopId(s.id)}
                />
              </div>

              <p className="font-mono text-[11px] text-brand-black/60 text-center">
                Click any numbered pin to preview waypoint details or tap "NAVIGATE 🗺️" to launch turn-by-turn navigation in Google Maps.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

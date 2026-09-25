"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/Skeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

interface NetworkStats {
  totalShelters: number;
  activeShelters: number;
  totalDonors: number;
  verifiedDonors: number;
  activeDrivers: number;
  totalDrivers: number;
  listingsToday: number;
  deliveriesToday: number;
  mealsRescuedMonth: number;
  kgDivertedMonth: number;
  pendingMatches: number;
  successRate: number;
}

interface ShelterRecord {
  id: string;
  name: string;
  address: string;
  status: string;
  capacity_kg: number;
  current_load_kg: number;
  food_preferences: string[];
}

interface DonorRecord {
  id: string;
  business_name: string;
  status: string;
  submitted_at: string;
  total_listings?: number;
}

interface DriverRecord {
  id: string;
  vehicle_type: string;
  is_available: boolean;
  reliability_score: number;
  profiles?: { full_name: string; phone: string };
}

interface RecentDelivery {
  id: string;
  listing_title: string;
  shelter_name: string;
  donor_name: string;
  driver_name: string;
  status: string;
  created_at: string;
  quantity_kg: number;
}

// ─── Mock data for demo (replace with real API calls) ────────────────────────

const MOCK_STATS: NetworkStats = {
  totalShelters: 24,
  activeShelters: 18,
  totalDonors: 87,
  verifiedDonors: 62,
  activeDrivers: 14,
  totalDrivers: 38,
  listingsToday: 12,
  deliveriesToday: 9,
  mealsRescuedMonth: 8420,
  kgDivertedMonth: 2840,
  pendingMatches: 4,
  successRate: 94,
};

const MOCK_SHELTERS: ShelterRecord[] = [
  { id: "s1", name: "Hope Community Shelter", address: "Indiranagar, Bengaluru", status: "active", capacity_kg: 200, current_load_kg: 80, food_preferences: ["Cooked rice dishes / curries", "Baked goods / bread"] },
  { id: "s2", name: "Sunrise Orphanage", address: "Koramangala, Bengaluru", status: "active", capacity_kg: 150, current_load_kg: 60, food_preferences: ["Dairy products / sweets"] },
  { id: "s3", name: "City Food Bank", address: "Whitefield, Bengaluru", status: "unavailable", capacity_kg: 500, current_load_kg: 320, food_preferences: ["Packaged / sealed foods"] },
  { id: "s4", name: "Community Relief Centre", address: "HSR Layout, Bengaluru", status: "active", capacity_kg: 120, current_load_kg: 20, food_preferences: [] },
];

const MOCK_DONORS: DonorRecord[] = [
  { id: "d1", business_name: "The Grand Hotel", status: "approved", submitted_at: "2026-09-01", total_listings: 48 },
  { id: "d2", business_name: "Saffron Restaurant", status: "approved", submitted_at: "2026-09-05", total_listings: 31 },
  { id: "d3", business_name: "FoodCo Corporate Kitchen", status: "approved", submitted_at: "2026-09-10", total_listings: 22 },
  { id: "d4", business_name: "Bakery Fresh", status: "pending_review", submitted_at: "2026-09-23", total_listings: 0 },
];

const MOCK_DRIVERS: DriverRecord[] = [
  { id: "dr1", vehicle_type: "bike", is_available: true, reliability_score: 0.98, profiles: { full_name: "Ravi Kumar", phone: "+91 98000 00001" } },
  { id: "dr2", vehicle_type: "van", is_available: false, reliability_score: 0.95, profiles: { full_name: "Priya Sharma", phone: "+91 98000 00002" } },
  { id: "dr3", vehicle_type: "car", is_available: true, reliability_score: 0.92, profiles: { full_name: "Anand Mehta", phone: "+91 98000 00003" } },
  { id: "dr4", vehicle_type: "scooter", is_available: true, reliability_score: 0.89, profiles: { full_name: "Sunita Rao", phone: "+91 98000 00004" } },
];

const MOCK_DELIVERIES: RecentDelivery[] = [
  { id: "del1", listing_title: "Vegetable Biryani (8kg)", shelter_name: "Hope Community Shelter", donor_name: "The Grand Hotel", driver_name: "Ravi Kumar", status: "delivered", created_at: new Date(Date.now() - 3600000).toISOString(), quantity_kg: 8 },
  { id: "del2", listing_title: "Paneer Butter Masala (5kg)", shelter_name: "Sunrise Orphanage", donor_name: "Saffron Restaurant", driver_name: "Anand Mehta", status: "in_transit", created_at: new Date(Date.now() - 7200000).toISOString(), quantity_kg: 5 },
  { id: "del3", listing_title: "Bread Loaves (12 units)", shelter_name: "City Food Bank", donor_name: "Bakery Fresh", driver_name: "Sunita Rao", status: "matched", created_at: new Date(Date.now() - 10800000).toISOString(), quantity_kg: 6 },
];

// ─── Status Badge Helper ──────────────────────────────────────────────────────

function statusVariant(status: string): "safe" | "warning" | "caution" | "critical" | "default" {
  if (status === "active" || status === "approved" || status === "delivered") return "safe";
  if (status === "in_transit" || status === "matched") return "caution";
  if (status === "pending_review" || status === "unavailable") return "warning";
  return "default";
}

// ─── Main Coordinator Dashboard ───────────────────────────────────────────────

export default function CoordinatorDashboard() {
  const [stats] = useState<NetworkStats>(MOCK_STATS);
  const [shelters] = useState<ShelterRecord[]>(MOCK_SHELTERS);
  const [donors] = useState<DonorRecord[]>(MOCK_DONORS);
  const [drivers] = useState<DriverRecord[]>(MOCK_DRIVERS);
  const [deliveries] = useState<RecentDelivery[]>(MOCK_DELIVERIES);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "shelters" | "donors" | "drivers" | "deliveries">("overview");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    // In production, fetch from /api/coordinator/stats, /api/shelter (all), etc.
    await new Promise((r) => setTimeout(r, 600));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  const tabs: { id: typeof activeTab; label: string; icon: string }[] = [
    { id: "overview", label: "OVERVIEW", icon: "📊" },
    { id: "shelters", label: "SHELTERS & NGOS", icon: "🏠" },
    { id: "donors", label: "FOOD DONORS", icon: "🍱" },
    { id: "drivers", label: "RESCUE DRIVERS", icon: "🚚" },
    { id: "deliveries", label: "DELIVERIES", icon: "📦" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="border-b-4 border-brand-black pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">🛡️</span>
              <div>
                <h1 className="font-display text-display-lg text-brand-black uppercase font-black tracking-tight">
                  NETWORK COORDINATOR
                </h1>
                <p className="font-mono text-sm text-brand-black/60 mt-0.5">
                  Food Redistribution Network · Real-time Operations Control
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-ers-safe/20 border-2 border-ers-safe font-mono text-xs font-bold text-brand-black">
              <span className="w-2 h-2 bg-ers-safe rounded-full animate-pulse" />
              NETWORK ONLINE
            </div>
            <Button variant="secondary" onClick={loadData} className="font-mono text-xs font-bold">
              ↻ REFRESH
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex flex-wrap gap-1 mt-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`font-mono text-xs font-bold px-4 py-2 border-2 transition-all ${
                activeTab === tab.id
                  ? "bg-brand-black text-brand-white border-brand-black"
                  : "bg-brand-white text-brand-black border-brand-black/30 hover:border-brand-black"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* ─── OVERVIEW TAB ─────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : (
            <>
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "ACTIVE SHELTERS", value: `${stats.activeShelters}/${stats.totalShelters}`, color: "text-brand-red", sub: "online now" },
                  { label: "VERIFIED DONORS", value: `${stats.verifiedDonors}/${stats.totalDonors}`, color: "text-brand-black", sub: "verified" },
                  { label: "ACTIVE DRIVERS", value: `${stats.activeDrivers}/${stats.totalDrivers}`, color: "text-brand-red", sub: "available" },
                  { label: "PENDING MATCHES", value: stats.pendingMatches, color: stats.pendingMatches > 5 ? "text-brand-red" : "text-brand-black", sub: "awaiting dispatch" },
                  { label: "LISTINGS TODAY", value: stats.listingsToday, color: "text-brand-red", sub: "posted today" },
                  { label: "DELIVERIES TODAY", value: stats.deliveriesToday, color: "text-brand-black", sub: "completed" },
                  { label: "MEALS RESCUED", value: `${stats.mealsRescuedMonth.toLocaleString()}`, color: "text-brand-red", sub: "this month" },
                  { label: "SUCCESS RATE", value: `${stats.successRate}%`, color: "text-brand-black", sub: "match-to-deliver" },
                ].map((m) => (
                  <Card key={m.label} className="border-4 border-brand-black shadow-brutal">
                    <CardContent className="text-center py-4">
                      <div className={`font-display text-display-xl ${m.color} font-black`}>{m.value}</div>
                      <div className="label-text text-brand-black/60 text-xs mt-1">{m.label}</div>
                      <div className="font-mono text-[10px] text-brand-black/40 mt-0.5">{m.sub}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Monthly Impact Bar */}
              <Card className="border-4 border-brand-black shadow-brutal bg-brand-black text-brand-white">
                <CardContent className="py-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    <div>
                      <div className="font-display text-display-xl text-brand-red">{stats.mealsRescuedMonth.toLocaleString()}</div>
                      <div className="font-mono text-xs text-brand-white/60 mt-1 uppercase">Meals Rescued</div>
                    </div>
                    <div>
                      <div className="font-display text-display-xl text-brand-white">{stats.kgDivertedMonth.toLocaleString()}</div>
                      <div className="font-mono text-xs text-brand-white/60 mt-1 uppercase">KG Diverted</div>
                    </div>
                    <div>
                      <div className="font-display text-display-xl text-brand-red">{Math.round(stats.kgDivertedMonth * 1.57).toLocaleString()}</div>
                      <div className="font-mono text-xs text-brand-white/60 mt-1 uppercase">KG CO₂e Saved</div>
                    </div>
                    <div>
                      <div className="font-display text-display-xl text-brand-white">{stats.successRate}%</div>
                      <div className="font-mono text-xs text-brand-white/60 mt-1 uppercase">Network Efficiency</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Alerts */}
                <Card className="border-4 border-brand-black shadow-brutal">
                  <CardHeader>
                    <h2 className="font-display text-display-sm text-brand-black uppercase font-black">
                      🔴 ACTIVE ALERTS
                    </h2>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {stats.pendingMatches > 0 ? (
                      <>
                        <div className="p-3 border-2 border-brand-red bg-brand-red/5 flex items-center justify-between">
                          <div>
                            <p className="font-mono text-xs font-bold text-brand-red">{stats.pendingMatches} MATCHES AWAITING DISPATCH</p>
                            <p className="font-mono text-[11px] text-brand-black/60">Unassigned food pickups need driver allocation</p>
                          </div>
                          <button onClick={() => setActiveTab("deliveries")} className="font-mono text-xs font-bold text-brand-red underline">VIEW →</button>
                        </div>
                        <div className="p-3 border-2 border-brand-black/20 bg-brand-cream flex items-center justify-between">
                          <div>
                            <p className="font-mono text-xs font-bold">CITY FOOD BANK — NEAR CAPACITY</p>
                            <p className="font-mono text-[11px] text-brand-black/60">320/500 kg used (64%) — review capacity</p>
                          </div>
                          <button onClick={() => setActiveTab("shelters")} className="font-mono text-xs font-bold underline">VIEW →</button>
                        </div>
                      </>
                    ) : (
                      <p className="font-mono text-xs text-brand-black/40 text-center py-4">No active alerts — network running smoothly</p>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Deliveries */}
                <Card className="border-4 border-brand-black shadow-brutal">
                  <CardHeader>
                    <h2 className="font-display text-display-sm text-brand-black uppercase font-black">
                      📦 LATEST DELIVERIES
                    </h2>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {deliveries.slice(0, 3).map((d) => (
                      <div key={d.id} className="flex items-center justify-between p-3 border-2 border-brand-black/10 bg-brand-white">
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-xs font-bold truncate">{d.listing_title}</p>
                          <p className="font-mono text-[11px] text-brand-black/60">{d.shelter_name} · {d.driver_name}</p>
                        </div>
                        <Badge variant={statusVariant(d.status)} className="font-mono text-[10px] ml-2 shrink-0">
                          {d.status.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                    ))}
                    <button onClick={() => setActiveTab("deliveries")} className="w-full font-mono text-xs font-bold text-brand-red underline pt-2">
                      VIEW ALL DELIVERIES →
                    </button>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      )}

      {/* ─── SHELTERS & NGOS TAB ──────────────────────────────────────────── */}
      {activeTab === "shelters" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-display-md text-brand-black uppercase font-black">
              SHELTERS & NGOS ({shelters.length})
            </h2>
            <div className="flex gap-3">
              <Badge variant="safe" className="font-mono text-xs">{shelters.filter(s => s.status === "active").length} ONLINE</Badge>
              <Badge variant="warning" className="font-mono text-xs">{shelters.filter(s => s.status !== "active").length} OFFLINE</Badge>
            </div>
          </div>

          <div className="space-y-3">
            {shelters.map((shelter) => {
              const utilPct = shelter.capacity_kg > 0
                ? Math.round((shelter.current_load_kg / shelter.capacity_kg) * 100)
                : 0;
              const available = Math.max(0, shelter.capacity_kg - shelter.current_load_kg);
              return (
                <Card key={shelter.id} className="border-4 border-brand-black shadow-brutal">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center">
                      <div>
                        <h3 className="font-display text-display-sm text-brand-black uppercase">{shelter.name}</h3>
                        <p className="font-mono text-xs text-brand-black/60">📍 {shelter.address}</p>
                        {shelter.food_preferences.length > 0 && (
                          <p className="font-mono text-[11px] text-brand-black/50 mt-1">
                            Prefers: {shelter.food_preferences.slice(0, 2).join(", ")}
                            {shelter.food_preferences.length > 2 && ` +${shelter.food_preferences.length - 2} more`}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="font-mono text-[10px] text-brand-black/50 uppercase mb-1">Capacity</p>
                        <div className="w-full h-3 bg-brand-black/10 border border-brand-black/20">
                          <div
                            className={`h-full ${utilPct > 80 ? "bg-brand-red" : utilPct > 50 ? "bg-brand-yellow" : "bg-ers-safe"}`}
                            style={{ width: `${utilPct}%` }}
                          />
                        </div>
                        <p className="font-mono text-[10px] text-brand-black/50 mt-1">{available}/{shelter.capacity_kg} kg free ({100 - utilPct}%)</p>
                      </div>

                      <div>
                        <Badge variant={statusVariant(shelter.status)} className="font-mono text-xs">
                          {shelter.status.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="font-mono text-xs border border-brand-black">
                          EDIT
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── DONORS TAB ───────────────────────────────────────────────────── */}
      {activeTab === "donors" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-display-md text-brand-black uppercase font-black">
              FOOD DONORS ({donors.length})
            </h2>
            <div className="flex gap-3">
              <Badge variant="safe" className="font-mono text-xs">{donors.filter(d => d.status === "approved").length} VERIFIED</Badge>
              <Badge variant="warning" className="font-mono text-xs">{donors.filter(d => d.status === "pending_review").length} PENDING</Badge>
            </div>
          </div>

          <div className="space-y-3">
            {donors.map((donor) => (
              <Card key={donor.id} className="border-4 border-brand-black shadow-brutal">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-4 items-center">
                    <div>
                      <h3 className="font-display text-display-sm text-brand-black uppercase">{donor.business_name}</h3>
                      <p className="font-mono text-xs text-brand-black/60">
                        Joined {new Date(donor.submitted_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="font-display text-display-md text-brand-red">{donor.total_listings ?? 0}</div>
                      <p className="font-mono text-[10px] text-brand-black/50 uppercase">Listings</p>
                    </div>
                    <Badge variant={statusVariant(donor.status)} className="font-mono text-xs w-fit">
                      {donor.status.replace("_", " ").toUpperCase()}
                    </Badge>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="font-mono text-xs border border-brand-black">
                        REVIEW
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─── DRIVERS TAB ──────────────────────────────────────────────────── */}
      {activeTab === "drivers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-display-md text-brand-black uppercase font-black">
              RESCUE DRIVERS ({drivers.length})
            </h2>
            <div className="flex gap-3">
              <Badge variant="safe" className="font-mono text-xs">{drivers.filter(d => d.is_available).length} ONLINE</Badge>
              <Badge variant="default" className="font-mono text-xs">{drivers.filter(d => !d.is_available).length} OFFLINE</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drivers.map((driver) => (
              <Card key={driver.id} className="border-4 border-brand-black shadow-brutal">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-display-sm text-brand-black uppercase">
                        {driver.profiles?.full_name || "Unknown Driver"}
                      </h3>
                      <p className="font-mono text-xs text-brand-black/60">
                        📞 {driver.profiles?.phone} · Vehicle: {driver.vehicle_type.toUpperCase()}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="font-mono text-xs text-brand-black/50">Reliability:</div>
                        <div className="font-mono text-xs font-bold text-ers-safe">
                          {Math.round(driver.reliability_score * 100)}%
                        </div>
                        <div className="w-24 h-2 bg-brand-black/10 border border-brand-black/20">
                          <div
                            className="h-full bg-ers-safe"
                            style={{ width: `${driver.reliability_score * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <Badge variant={driver.is_available ? "safe" : "default"} className="font-mono text-xs">
                      {driver.is_available ? "ONLINE ●" : "OFFLINE ○"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─── DELIVERIES TAB ───────────────────────────────────────────────── */}
      {activeTab === "deliveries" && (
        <div className="space-y-4">
          <h2 className="font-display text-display-md text-brand-black uppercase font-black">
            RECENT DELIVERIES & MATCHES
          </h2>

          {deliveries.length === 0 ? (
            <EmptyState
              title="NO DELIVERIES YET"
              description="Active delivery data will appear here as your network processes food rescue runs."
            />
          ) : (
            <div className="space-y-3">
              {deliveries.map((d) => (
                <Card key={d.id} className="border-4 border-brand-black shadow-brutal">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center">
                      <div>
                        <h3 className="font-display text-display-sm text-brand-black uppercase">{d.listing_title}</h3>
                        <p className="font-mono text-xs text-brand-black/60">
                          {d.donor_name} → {d.shelter_name}
                        </p>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] text-brand-black/50 uppercase mb-0.5">Driver</p>
                        <p className="font-mono text-xs font-bold">{d.driver_name}</p>
                      </div>
                      <div>
                        <p className="font-mono text-[10px] text-brand-black/50 uppercase mb-0.5">Weight</p>
                        <p className="font-mono text-xs font-bold">{d.quantity_kg} kg</p>
                      </div>
                      <Badge variant={statusVariant(d.status)} className="font-mono text-xs w-fit">
                        {d.status.replace("_", " ").toUpperCase()}
                      </Badge>
                      <p className="font-mono text-[11px] text-brand-black/40">
                        {new Date(d.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

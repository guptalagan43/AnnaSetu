"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";

interface ShelterConfig {
  id: string;
  name: string;
  address: string;
  capacity_kg: number;
  current_load_kg: number;
  available_capacity_kg?: number;
  status: "active" | "unavailable" | "suspended";
  accepts_auto_confirm: boolean;
  food_preferences: string[];
  food_restrictions: string[];
}

const AVAILABLE_PREFERENCES = [
  "Cooked rice dishes / curries",
  "Baked goods / bread",
  "Dairy products / sweets",
  "Packaged / sealed foods",
  "Fresh fruits & vegetables",
  "Cooked pasta & noodles",
  "Soups & stews",
  "Meat & poultry dishes",
];

const AVAILABLE_RESTRICTIONS = [
  "Pure Vegetarian Only (No Meat/Fish)",
  "Halal Certified Only",
  "Nut / Peanut Free",
  "Dairy / Lactose Free",
  "Egg Free",
  "No Raw Meat",
];

export default function ShelterCapacityPage() {
  const [shelter, setShelter] = useState<ShelterConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form states
  const [capacityKg, setCapacityKg] = useState<number>(100);
  const [currentLoadKg, setCurrentLoadKg] = useState<number>(0);
  const [status, setStatus] = useState<"active" | "unavailable">("active");
  const [acceptsAutoConfirm, setAcceptsAutoConfirm] = useState(true);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);

  // Coordinator invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Shelter Coordinator");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ message: string; link?: string } | null>(null);

  useEffect(() => {
    async function loadShelter() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/shelter");
        if (!res.ok) throw new Error("Failed to load shelter profile");
        const json = await res.json();
        const data: ShelterConfig = json.data;
        setShelter(data);
        setCapacityKg(Number(data.capacity_kg || 100));
        setCurrentLoadKg(Number(data.current_load_kg || 0));
        setStatus(data.status === "unavailable" ? "unavailable" : "active");
        setAcceptsAutoConfirm(data.accepts_auto_confirm ?? true);
        setSelectedPreferences(data.food_preferences || []);
        setSelectedRestrictions(data.food_restrictions || []);
      } catch (err) {
        console.error("Error loading shelter config:", err);
        setErrorMessage("Could not load shelter configuration.");
      } finally {
        setIsLoading(false);
      }
    }
    loadShelter();
  }, []);

  const handleTogglePreference = (pref: string) => {
    setSelectedPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const handleToggleRestriction = (rest: string) => {
    setSelectedRestrictions((prev) =>
      prev.includes(rest) ? prev.filter((r) => r !== rest) : [...prev, rest]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      setSaveMessage(null);
      setErrorMessage(null);

      const res = await fetch("/api/shelter", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capacity_kg: capacityKg,
          current_load_kg: currentLoadKg,
          status,
          accepts_auto_confirm: acceptsAutoConfirm,
          food_preferences: selectedPreferences,
          food_restrictions: selectedRestrictions,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update configuration");
      }

      const updated = await res.json();
      setShelter(updated.data);
      setSaveMessage("Shelter configuration and preferences saved successfully!");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error saving configuration");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setIsInviting(true);
      setInviteResult(null);

      const res = await fetch("/api/shelter/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invitation");

      setInviteResult({
        message: data.message,
        link: data.inviteLink,
      });
      setInviteEmail("");
    } catch (err) {
      setInviteResult({
        message: err instanceof Error ? err.message : "Failed to invite coordinator",
      });
    } finally {
      setIsInviting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center font-mono">
        <p className="text-brand-black/60">LOADING SHELTER CONFIGURATION...</p>
      </div>
    );
  }

  const freeCapacity = Math.max(0, capacityKg - currentLoadKg);
  const utilizationPct = capacityKg > 0 ? Math.min(100, Math.round((currentLoadKg / capacityKg) * 100)) : 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-4 border-brand-black pb-4">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/shelter"
              className="font-mono text-xs font-bold text-brand-black/60 hover:text-brand-black underline"
            >
              ← BACK TO DASHBOARD
            </Link>
          </div>
          <h1 className="font-display text-display-lg text-brand-black uppercase font-black tracking-tight mt-1">
            CAPACITY & PREFERENCES
          </h1>
          <p className="font-mono text-sm text-brand-black/70">
            {shelter?.name || "Community Food Shelter"} · Manage storage limits, dietary rules & team
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={status === "active" ? "safe" : "warning"} className="font-mono">
            STATUS: {status.toUpperCase()}
          </Badge>
        </div>
      </div>

      {saveMessage && (
        <div className="p-4 bg-ers-safe/20 border-3 border-ers-safe font-mono text-sm font-bold text-brand-black flex items-center gap-2">
          <span>✅</span>
          <span>{saveMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-brand-red/10 border-3 border-brand-red font-mono text-sm font-bold text-brand-red flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: Capacity & Storage Limits */}
        <Card className="border-4 border-brand-black shadow-brutal">
          <CardHeader>
            <h2 className="font-display text-display-md text-brand-black uppercase font-extrabold">
              1. STORAGE CAPACITY
            </h2>
            <p className="font-mono text-xs text-brand-black/60">
              Matches exceeding available capacity are automatically excluded by the geo-matching engine.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Visual Gauge */}
            <div className="bg-brand-white p-4 border-2 border-brand-black">
              <div className="flex justify-between font-mono text-xs font-bold mb-2">
                <span>CURRENT LOAD: {currentLoadKg} KG</span>
                <span>AVAILABLE: {freeCapacity} KG FREE</span>
                <span>MAX CAPACITY: {capacityKg} KG</span>
              </div>
              <div className="w-full h-8 bg-brand-black/10 border-2 border-brand-black relative overflow-hidden">
                <div
                  className="h-full bg-brand-red transition-all"
                  style={{ width: `${utilizationPct}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold">
                  <span className={utilizationPct > 50 ? "text-brand-white" : "text-brand-black"}>
                    {utilizationPct}% UTILIZED ({freeCapacity} kg remaining)
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="label-text text-brand-black mb-2 block">
                  MAX STORAGE CAPACITY (KG)
                </label>
                <Input
                  type="number"
                  min="0"
                  max="10000"
                  step="5"
                  value={capacityKg}
                  onChange={(e) => setCapacityKg(Math.max(0, Number(e.target.value)))}
                  required
                />
                <span className="font-mono text-[11px] text-brand-black/60 block mt-1">
                  Total maximum surplus weight your facility can hold.
                </span>
              </div>

              <div>
                <label className="label-text text-brand-black mb-2 block">
                  CURRENT LOAD (KG)
                </label>
                <Input
                  type="number"
                  min="0"
                  max={capacityKg}
                  step="1"
                  value={currentLoadKg}
                  onChange={(e) => setCurrentLoadKg(Math.max(0, Number(e.target.value)))}
                  required
                />
                <span className="font-mono text-[11px] text-brand-black/60 block mt-1">
                  Food weight already received or stored on-site.
                </span>
              </div>
            </div>

            {/* Availability & Auto-Confirm Toggles */}
            <div className="border-t-2 border-brand-black/10 pt-4 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-brand-white border-2 border-brand-black">
                <input
                  type="checkbox"
                  id="unavailableToggle"
                  checked={status === "unavailable"}
                  onChange={(e) => setStatus(e.target.checked ? "unavailable" : "active")}
                  className="w-5 h-5 mt-0.5 accent-brand-red"
                />
                <div>
                  <label htmlFor="unavailableToggle" className="font-mono font-bold text-sm text-brand-black cursor-pointer">
                    MARK UNAVAILABLE TODAY (PAUSE INCOMING MATCHES)
                  </label>
                  <p className="font-mono text-xs text-brand-black/60">
                    Temporarily sets your shelter to offline. You will be excluded from all candidate matching cascades until re-activated.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-brand-white border-2 border-brand-black">
                <input
                  type="checkbox"
                  id="autoConfirmToggle"
                  checked={acceptsAutoConfirm}
                  onChange={(e) => setAcceptsAutoConfirm(e.target.checked)}
                  className="w-5 h-5 mt-0.5 accent-brand-black"
                />
                <div>
                  <label htmlFor="autoConfirmToggle" className="font-mono font-bold text-sm text-brand-black cursor-pointer">
                    ALLOW AGENTIC DISPATCHER AUTO-CONFIRM
                  </label>
                  <p className="font-mono text-xs text-brand-black/60">
                    Permits the autonomous dispatcher to auto-confirm emergency matches (ERS &gt; 80) if no coordinator responds within 10 minutes.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Food Preferences */}
        <Card className="border-4 border-brand-black shadow-brutal">
          <CardHeader>
            <h2 className="font-display text-display-md text-brand-black uppercase font-extrabold">
              2. ACCEPTED FOOD CATEGORIES
            </h2>
            <p className="font-mono text-xs text-brand-black/60">
              Matching engine weights listings matching these preferred categories higher.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AVAILABLE_PREFERENCES.map((pref) => {
                const checked = selectedPreferences.includes(pref);
                return (
                  <label
                    key={pref}
                    className={`flex items-center gap-3 p-3 border-2 cursor-pointer transition-all ${
                      checked
                        ? "border-brand-black bg-brand-black text-brand-white shadow-brutal-sm"
                        : "border-brand-black/20 bg-brand-white text-brand-black hover:border-brand-black"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleTogglePreference(pref)}
                      className="sr-only"
                    />
                    <span className="font-mono text-base">{checked ? "✅" : "⬜"}</span>
                    <span className="font-mono text-xs font-bold uppercase">{pref}</span>
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Dietary & Allergen Restrictions */}
        <Card className="border-4 border-brand-black shadow-brutal">
          <CardHeader>
            <h2 className="font-display text-display-md text-brand-black uppercase font-extrabold">
              3. HARD DIETARY & ALLERGEN RESTRICTIONS
            </h2>
            <p className="font-mono text-xs text-brand-black/60">
              Hard exclusion filters: food violating any selected restriction will NEVER be routed to your shelter.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {AVAILABLE_RESTRICTIONS.map((rest) => {
                const checked = selectedRestrictions.includes(rest);
                return (
                  <label
                    key={rest}
                    className={`flex items-center gap-3 p-3 border-2 cursor-pointer transition-all ${
                      checked
                        ? "border-brand-red bg-brand-red text-brand-white shadow-brutal-sm"
                        : "border-brand-black/20 bg-brand-white text-brand-black hover:border-brand-black"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleRestriction(rest)}
                      className="sr-only"
                    />
                    <span className="font-mono text-base">{checked ? "🚫" : "⬜"}</span>
                    <span className="font-mono text-xs font-bold uppercase">{rest}</span>
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Link href="/shelter">
            <Button variant="ghost">CANCEL</Button>
          </Link>
          <Button variant="primary" type="submit" disabled={isSaving} className="font-bold tracking-wider px-8">
            {isSaving ? "SAVING..." : "SAVE CONFIGURATION"}
          </Button>
        </div>
      </form>

      {/* Section 4: Coordinator Invite Flow */}
      <Card className="border-4 border-brand-black shadow-brutal mt-12">
        <CardHeader>
          <h2 className="font-display text-display-md text-brand-black uppercase font-extrabold">
            4. INVITE SHELTER COORDINATOR
          </h2>
          <p className="font-mono text-xs text-brand-black/60">
            Send an email invitation link to staff members or volunteers to review and accept food rescue matches.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendInvite} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="label-text text-brand-black mb-1 block">
                  COORDINATOR EMAIL ADDRESS
                </label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="coordinator@shelter.org"
                  required
                />
              </div>

              <div>
                <label className="label-text text-brand-black mb-1 block">
                  ROLE
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="input-field w-full text-xs font-mono py-2"
                >
                  <option value="Shelter Coordinator">Shelter Coordinator</option>
                  <option value="Volunteer Manager">Volunteer Manager</option>
                  <option value="Kitchen Lead">Kitchen Lead</option>
                </select>
              </div>
            </div>

            <Button
              variant="secondary"
              type="submit"
              disabled={isInviting}
              className="font-bold tracking-wider"
            >
              {isInviting ? "SENDING INVITATION..." : "✉️ SEND EMAIL INVITATION"}
            </Button>
          </form>

          {inviteResult && (
            <div className="mt-4 p-4 border-2 border-brand-black bg-brand-cream space-y-2">
              <p className="font-mono text-xs font-bold text-brand-black">
                {inviteResult.message}
              </p>
              {inviteResult.link && (
                <div className="font-mono text-[11px] bg-brand-white p-2 border border-brand-black/30 break-all select-all">
                  <strong>Direct Link:</strong> {inviteResult.link}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

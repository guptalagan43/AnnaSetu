"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

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

interface ShelterPrefs {
  id: string;
  name: string;
  food_preferences: string[];
  food_restrictions: string[];
  accepts_auto_confirm: boolean;
}

export default function ShelterPreferencesPage() {
  const [shelter, setShelter] = useState<ShelterPrefs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [selectedRestrictions, setSelectedRestrictions] = useState<string[]>([]);
  const [acceptsAutoConfirm, setAcceptsAutoConfirm] = useState(true);

  useEffect(() => {
    async function loadShelter() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/shelter");
        if (!res.ok) throw new Error("Failed to load shelter profile");
        const json = await res.json();
        const data: ShelterPrefs = json.data;
        setShelter(data);
        setSelectedPreferences(data.food_preferences || []);
        setSelectedRestrictions(data.food_restrictions || []);
        setAcceptsAutoConfirm(data.accepts_auto_confirm ?? true);
      } catch (err) {
        setErrorMessage("Could not load shelter preferences.");
        console.error(err);
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
          food_preferences: selectedPreferences,
          food_restrictions: selectedRestrictions,
          accepts_auto_confirm: acceptsAutoConfirm,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update preferences");
      }

      const updated = await res.json();
      setShelter(updated.data);
      setSaveMessage("Food preferences and dietary restrictions saved successfully!");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Error saving preferences");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center font-mono">
        <p className="text-brand-black/60">LOADING SHELTER PREFERENCES...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-4 border-brand-black pb-4">
        <div>
          <Link
            href="/shelter"
            className="font-mono text-xs font-bold text-brand-black/60 hover:text-brand-black underline"
          >
            ← BACK TO DASHBOARD
          </Link>
          <h1 className="font-display text-display-lg text-brand-black uppercase font-black tracking-tight mt-1">
            FOOD PREFERENCES
          </h1>
          <p className="font-mono text-sm text-brand-black/70">
            {shelter?.name || "Community Food Shelter"} · Set dietary rules & food category preferences
          </p>
        </div>
        <Link href="/shelter/capacity">
          <Button variant="ghost" className="border-2 border-brand-black font-mono text-xs font-bold">
            MANAGE CAPACITY →
          </Button>
        </Link>
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
        {/* Section 1: Food Categories */}
        <Card className="border-4 border-brand-black shadow-brutal">
          <CardHeader>
            <h2 className="font-display text-display-md text-brand-black uppercase font-extrabold">
              1. ACCEPTED FOOD CATEGORIES
            </h2>
            <p className="font-mono text-xs text-brand-black/60">
              The matching engine prioritizes listings from donors whose food type matches your preferences.
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

        {/* Section 2: Dietary Restrictions */}
        <Card className="border-4 border-brand-black shadow-brutal">
          <CardHeader>
            <h2 className="font-display text-display-md text-brand-black uppercase font-extrabold">
              2. HARD DIETARY & ALLERGEN RESTRICTIONS
            </h2>
            <p className="font-mono text-xs text-brand-black/60">
              Hard exclusion filters — food violating any selected restriction will NEVER be routed to your shelter.
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

        {/* Section 3: Auto-Confirm Setting */}
        <Card className="border-4 border-brand-black shadow-brutal">
          <CardHeader>
            <h2 className="font-display text-display-md text-brand-black uppercase font-extrabold">
              3. DISPATCHER SETTINGS
            </h2>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Link href="/shelter">
            <Button variant="ghost">CANCEL</Button>
          </Link>
          <Button variant="primary" type="submit" disabled={isSaving} className="font-bold tracking-wider px-8">
            {isSaving ? "SAVING..." : "SAVE PREFERENCES"}
          </Button>
        </div>
      </form>
    </div>
  );
}

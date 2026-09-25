"use client";

import { useState } from "react";

export function ErsInteractiveSimulator() {
  const [category, setCategory] = useState<"dairy" | "cooked" | "bakery" | "packaged">("cooked");
  const [hoursElapsed, setHoursElapsed] = useState(3);
  const [ambientTemp, setAmbientTemp] = useState(32);
  const [isRefrigerated, setIsRefrigerated] = useState(false);

  // Compute simulated ERS
  const categoryBase: Record<string, number> = {
    dairy: 40,
    cooked: 30,
    bakery: 20,
    packaged: 10,
  };

  const baseScore = categoryBase[category] || 25;
  const elapsedPenalty = hoursElapsed * 9;
  const tempPenalty = isRefrigerated ? -15 : Math.max(0, (ambientTemp - 24) * 2);
  const calculatedScore = Math.min(100, Math.max(5, Math.round(baseScore + elapsedPenalty + tempPenalty)));

  let tierLabel = "SAFE (0–49)";
  let tierColor = "bg-emerald-600 text-white";
  let actionText = "Standard volunteer dispatch window. Open for shelter claiming.";

  if (calculatedScore >= 95) {
    tierLabel = "EMERGENCY (95–100)";
    tierColor = "bg-brand-red text-white animate-pulse";
    actionText = "FLASH DISPATCH: Nearest driver immediately assigned. 3-minute shelter bypass.";
  } else if (calculatedScore >= 80) {
    tierLabel = "CRITICAL (80–94)";
    tierColor = "bg-brand-red text-white";
    actionText = "AUTO-CONFIRM: Direct automated matching triggered with 5-minute opt-out.";
  } else if (calculatedScore >= 65) {
    tierLabel = "WARNING (65–79)";
    tierColor = "bg-amber-500 text-black";
    actionText = "PRIORITY MATCH: Shelters alerted via push notifications within 8km radius.";
  } else if (calculatedScore >= 50) {
    tierLabel = "CAUTION (50–64)";
    tierColor = "bg-yellow-400 text-black";
    actionText = "MODERATE: Matched to nearest standard shelter capacity.";
  }

  return (
    <div className="bg-brand-cream border-4 border-brand-black p-6 md:p-8 brutal-card">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-brand-black pb-4 mb-6">
        <div>
          <span className="font-mono text-xs font-bold bg-brand-red text-brand-white px-2 py-0.5">
            ALGORITHMIC HEURISTIC ENGINE
          </span>
          <h3 className="font-display text-display-md text-brand-black mt-1">
            TEST THE EXPIRY RISK SCORE (ERS)
          </h3>
        </div>
        <div className="font-mono text-xs text-brand-black/60 font-bold">
          SRS §17.4 / PROPRIETARY FORMULA
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Controls */}
        <div className="lg:col-span-7 space-y-5">
          {/* Category */}
          <div>
            <label className="block font-mono text-xs font-bold uppercase mb-2">
              1. Food Perishability Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "cooked", label: "Cooked Meals" },
                { id: "dairy", label: "Dairy & Milk" },
                { id: "bakery", label: "Bakery / Bread" },
                { id: "packaged", label: "Dry / Packaged" },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id as any)}
                  className={`py-2 px-3 text-xs font-mono font-bold border-2 border-brand-black transition-all ${
                    category === c.id
                      ? "bg-brand-black text-brand-white shadow-sm"
                      : "bg-brand-white text-brand-black hover:bg-brand-black/10"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Elapsed Slider */}
          <div>
            <div className="flex items-center justify-between font-mono text-xs font-bold mb-2">
              <span>2. Hours Since Preparation</span>
              <span className="bg-brand-white px-2 py-0.5 border border-brand-black">
                {hoursElapsed} Hours
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="8"
              step="0.5"
              value={hoursElapsed}
              onChange={(e) => setHoursElapsed(parseFloat(e.target.value))}
              className="w-full accent-brand-red cursor-pointer h-2 bg-brand-white border border-brand-black rounded-none"
            />
          </div>

          {/* Ambient Temperature Slider */}
          <div>
            <div className="flex items-center justify-between font-mono text-xs font-bold mb-2">
              <span>3. Ambient Weather Temperature</span>
              <span className="bg-brand-white px-2 py-0.5 border border-brand-black">
                {ambientTemp}°C
              </span>
            </div>
            <input
              type="range"
              min="18"
              max="45"
              step="1"
              value={ambientTemp}
              onChange={(e) => setAmbientTemp(parseInt(e.target.value))}
              className="w-full accent-brand-black cursor-pointer h-2 bg-brand-white border border-brand-black rounded-none"
            />
          </div>

          {/* Cold Storage Toggle */}
          <div className="flex items-center justify-between p-3 border-2 border-brand-black bg-brand-white">
            <span className="font-mono text-xs font-bold">
              Stored In Cold Storage / Chiller (&lt; 5°C)?
            </span>
            <button
              type="button"
              onClick={() => setIsRefrigerated(!isRefrigerated)}
              className={`px-3 py-1 text-xs font-mono font-bold border-2 border-brand-black transition-colors ${
                isRefrigerated ? "bg-emerald-600 text-white" : "bg-brand-cream text-brand-black"
              }`}
            >
              {isRefrigerated ? "YES (-15 ERS)" : "NO (EXPOSED)"}
            </button>
          </div>
        </div>

        {/* ERS Result Meter */}
        <div className="lg:col-span-5 bg-brand-white border-4 border-brand-black p-6 text-center space-y-4 shadow-brutal">
          <div className="font-mono text-xs font-bold text-brand-black/60 uppercase">
            CALCULATED EXPIRY RISK SCORE
          </div>

          <div className="font-display text-7xl font-black text-brand-black tracking-tighter">
            {calculatedScore}
            <span className="text-2xl font-mono text-brand-black/40">/100</span>
          </div>

          <div>
            <span className={`inline-block font-mono text-xs font-bold px-3 py-1 uppercase ${tierColor}`}>
              TIER: {tierLabel}
            </span>
          </div>

          <div className="border-t-2 border-brand-black/20 pt-4 text-left">
            <div className="font-mono text-[10px] font-bold text-brand-black/60 uppercase mb-1">
              AUTONOMOUS AGENT ACTION:
            </div>
            <p className="font-body text-xs text-brand-black/90 leading-relaxed font-medium">
              {actionText}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";

interface SimulationRun {
  donor: string;
  food: string;
  weight: number;
  servings: number;
  shelter: string;
  driver: string;
  vehicle: string;
  ers: number;
  eta: string;
  status: string;
}

const RUNS: SimulationRun[] = [
  {
    donor: "Grand Hyatt Banquet Hall",
    food: "Paneer Lababdar & Jeera Pulao",
    weight: 38,
    servings: 95,
    shelter: "Mother Teresa Home for Children",
    driver: "Rajesh Kumar (Volunteer #892)",
    vehicle: "Ather 450X (Thermal Bag)",
    ers: 92,
    eta: "11 mins",
    status: "DISPATCHED — IN TRANSIT",
  },
  {
    donor: "Taj Vivanta Rooftop Café",
    food: "Fresh Sandwiches & Fruit Pastries",
    weight: 22,
    servings: 55,
    shelter: "Shanti Nivas Relief Community",
    driver: "Pooja V. (Volunteer #411)",
    vehicle: "Tata Nexon EV (Insulated Box)",
    ers: 84,
    eta: "7 mins",
    status: "DRIVER AT PICKUP LOCATION",
  },
  {
    donor: "Infosys Campus Canteen B4",
    food: "Sambar, Curd Rice & Mixed Veg Curry",
    weight: 65,
    servings: 160,
    shelter: "Sneha Deep Hope Center",
    driver: "Vikram S. (Fleet Driver #104)",
    vehicle: "Mahindra Bolero Maxi Truck",
    ers: 76,
    eta: "14 mins",
    status: "AUTO-MATCH CONFIRMED",
  },
];

export function SimulatedDispatchHUD() {
  const [index, setIndex] = useState(0);
  const active = RUNS[index];

  return (
    <div className="relative group perspective-[1200px]">
      {/* 3D Tilted Card Container */}
      <div className="w-full bg-brand-cream border-4 border-brand-black p-6 md:p-8 shadow-brutal transition-all duration-300 transform md:rotate-y-[-4deg] md:rotate-x-[4deg] group-hover:rotate-y-0 group-hover:rotate-x-0 group-hover:shadow-brutal-lg">
        {/* HUD Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-brand-black pb-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-brand-red rounded-none animate-pulse"></span>
            <span className="font-mono text-xs font-black tracking-widest text-brand-black">
              LIVE AGENTIC DISPATCH TELEMETRY
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-brand-black/60 font-bold">RUN {index + 1} OF 3</span>
            <button
              onClick={() => setIndex((prev) => (prev + 1) % RUNS.length)}
              className="font-mono text-xs font-bold bg-brand-black text-brand-white px-2 py-1 hover:bg-brand-red transition-colors"
            >
              NEXT DISPATCH ↻
            </button>
          </div>
        </div>

        {/* ERS Badge & Status Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="border-2 border-brand-black bg-brand-white p-4">
            <div className="font-mono text-[10px] text-brand-black/60 font-bold uppercase mb-1">
              PERISHABILITY RISK (ERS)
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl text-brand-red font-black">{active.ers}</span>
              <span className="font-mono text-xs text-brand-black/50">/ 100</span>
            </div>
            <span className="inline-block bg-brand-red text-brand-white text-[10px] font-mono font-bold px-2 py-0.5 mt-1">
              CRITICAL EXPIRY
            </span>
          </div>

          <div className="border-2 border-brand-black bg-brand-white p-4">
            <div className="font-mono text-[10px] text-brand-black/60 font-bold uppercase mb-1">
              FOOD BATCH QUANTITY
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl text-brand-black font-black">{active.weight}</span>
              <span className="font-mono text-sm font-bold text-brand-black/70">KG</span>
            </div>
            <span className="text-xs font-body text-brand-black/70">
              ≈ {active.servings} Warm Meals
            </span>
          </div>

          <div className="border-2 border-brand-black bg-brand-white p-4">
            <div className="font-mono text-[10px] text-brand-black/60 font-bold uppercase mb-1">
              DISPATCH ARRIVAL ETA
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl text-emerald-600 font-black">{active.eta}</span>
            </div>
            <span className="inline-block bg-emerald-600 text-brand-white text-[10px] font-mono font-bold px-2 py-0.5 mt-1">
              {active.status}
            </span>
          </div>
        </div>

        {/* Origin & Destination Nodes */}
        <div className="space-y-4 border-y-2 border-brand-black/20 py-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-brand-red text-brand-white font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              A
            </div>
            <div>
              <div className="font-mono text-[10px] font-bold text-brand-black/50 uppercase">COMMERCIAL DONOR</div>
              <div className="font-display text-lg text-brand-black leading-tight">{active.donor}</div>
              <div className="font-body text-xs text-brand-black/70">Batch: {active.food}</div>
            </div>
          </div>

          <div className="w-0.5 h-4 bg-brand-black ml-3 my-0.5"></div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-emerald-600 text-brand-white font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              B
            </div>
            <div>
              <div className="font-mono text-[10px] font-bold text-brand-black/50 uppercase">ALLOCATED CHARITY</div>
              <div className="font-display text-lg text-brand-black leading-tight">{active.shelter}</div>
              <div className="font-body text-xs text-brand-black/70">Courier: {active.driver} ({active.vehicle})</div>
            </div>
          </div>
        </div>

        {/* Live Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-mono text-xs text-brand-black/70">
            ⚡ Automated 5-min auto-confirm triggered by AI Engine
          </div>
          <Link
            href="/public-impact"
            className="w-full sm:w-auto btn-primary text-xs py-2 px-4 text-center"
          >
            VIEW LIVE GEOSPATIAL HEATMAP →
          </Link>
        </div>
      </div>
    </div>
  );
}

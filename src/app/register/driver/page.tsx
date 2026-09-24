"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

const VEHICLES = [
  { id: "bike", label: "Motorcycle / Bike", icon: "🏍️", desc: "Best for quick small pickups (< 15 kg)" },
  { id: "scooter", label: "Scooter", icon: "🛵", desc: "Small bags & containers (< 15 kg)" },
  { id: "auto", label: "Auto Rickshaw", icon: "🛺", desc: "Medium loads (< 80 kg)" },
  { id: "car", label: "Car / Hatchback", icon: "🚗", desc: "Medium loads & trays (< 100 kg)" },
  { id: "van", label: "Delivery Van / Tempo", icon: "🚐", desc: "Large multi-tray rescue runs (> 100 kg)" },
];

export default function DriverRegisterPage() {
  const router = useRouter();
  const [vehicleType, setVehicleType] = useState("bike");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setErrorMsg("Please enter your contact phone number.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle_type: vehicleType,
          phone: phone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register driver profile");
      }

      router.push("/driver");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Registration error");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="inline-block text-center w-full">
          <span className="font-display text-display-lg text-brand-black tracking-tight">
            ANNA<span className="text-brand-red">SETU</span>
          </span>
        </Link>
        <h2 className="mt-2 text-center font-display text-display-sm text-brand-black uppercase font-black">
          VOLUNTEER DRIVER SIGNUP
        </h2>
        <p className="mt-1 text-center font-mono text-xs text-brand-black/60">
          Rescue surplus food from donors and deliver directly to nearby shelters.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <Card className="border-4 border-brand-black shadow-brutal p-6 bg-brand-white">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="p-3 bg-brand-red/10 border-2 border-brand-red font-mono text-xs font-bold text-brand-red">
                ⚠️ {errorMsg}
              </div>
            )}

            <div>
              <label className="label-text text-brand-black mb-1 block">
                CONTACT PHONE NUMBER (FOR DISPATCH COORDINATION)
              </label>
              <Input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                required
              />
              <span className="font-mono text-[10px] text-brand-black/60 block mt-1">
                Shelters and donors can contact you during active pickups.
              </span>
            </div>

            <div>
              <label className="label-text text-brand-black mb-2 block">
                PRIMARY RESCUE VEHICLE
              </label>
              <div className="space-y-2">
                {VEHICLES.map((v) => (
                  <label
                    key={v.id}
                    className={`flex items-center gap-3 p-3 border-2 cursor-pointer transition-all ${
                      vehicleType === v.id
                        ? "border-brand-black bg-brand-black text-brand-white shadow-brutal-sm"
                        : "border-brand-black/20 bg-brand-white text-brand-black hover:border-brand-black"
                    }`}
                  >
                    <input
                      type="radio"
                      name="vehicle"
                      value={v.id}
                      checked={vehicleType === v.id}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="sr-only"
                    />
                    <span className="text-xl">{v.icon}</span>
                    <div className="flex-1">
                      <p className="font-mono text-xs font-bold uppercase">{v.label}</p>
                      <p className={`font-mono text-[11px] ${vehicleType === v.id ? "text-brand-white/80" : "text-brand-black/60"}`}>
                        {v.desc}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full justify-center font-bold tracking-wider py-4 text-sm"
            >
              {isSubmitting ? "ACTIVATING DRIVER ACCOUNT..." : "ACTIVATE DRIVER PROFILE →"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

import { requireRole } from "@/lib/auth/guards";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Bell, Sliders, ShieldCheck, Database } from "lucide-react";

export default async function SettingsPage() {
  await requireRole([
    "super_admin",
    "platform_admin",
    "moderator",
    "reporter",
    "donor_admin",
    "donor_staff",
    "shelter_admin",
    "shelter_coordinator",
    "verified_driver",
    "casual_volunteer",
    "observer_gov",
    "observer_esg",
  ])();

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <span className="label-text text-brand-red font-mono">SYSTEM PREFERENCES</span>
        <h1 className="font-display text-display-lg text-brand-black uppercase">
          APP SETTINGS
        </h1>
        <p className="font-body text-body-md text-brand-black/70 mt-1">
          Notification parameters, dispatch sound triggers, and security controls.
        </p>
      </div>

      <div className="space-y-6">
        <Card variant="default">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-black text-brand-white border-2 border-brand-black flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-xl text-brand-black uppercase">DISPATCH ALERTS</h3>
                <p className="font-body text-body-sm text-brand-black/60">Manage SMTP and real-time push events</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center justify-between p-3 bg-brand-white border-2 border-brand-black cursor-pointer">
              <span className="font-body text-body-sm font-bold text-brand-black">ERS Critical Alerts (Score &gt; 80)</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-brand-red" />
            </label>
            <label className="flex items-center justify-between p-3 bg-brand-white border-2 border-brand-black cursor-pointer">
              <span className="font-body text-body-sm font-bold text-brand-black">Driver Assignment Push Alerts</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-brand-red" />
            </label>
            <label className="flex items-center justify-between p-3 bg-brand-white border-2 border-brand-black cursor-pointer">
              <span className="font-body text-body-sm font-bold text-brand-black">Weekly Impact ESG Digest (Mondays)</span>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-brand-red" />
            </label>
          </CardContent>
        </Card>

        <Card variant="default">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-red text-brand-white border-2 border-brand-black flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-xl text-brand-black uppercase">ENVIRONMENT CONTROLS</h3>
                <p className="font-body text-body-sm text-brand-black/60">Autonomous subsystem telemetry</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 font-mono text-xs">
            <div className="flex justify-between p-3 bg-brand-white border-2 border-brand-black">
              <span className="text-brand-black/70">RADAR FREQUENCY</span>
              <span className="font-bold text-brand-black">15 Minutes (BullMQ)</span>
            </div>
            <div className="flex justify-between p-3 bg-brand-white border-2 border-brand-black">
              <span className="text-brand-black/70">AGENTIC DISPATCHER CYCLE</span>
              <span className="font-bold text-brand-black">2 Minutes (Vercel Cron)</span>
            </div>
            <div className="flex justify-between p-3 bg-brand-white border-2 border-brand-black">
              <span className="text-brand-black/70">ACTIVE METHODOLOGY</span>
              <span className="font-bold text-brand-black">EPA WARM v15 (2.5x CO₂e)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

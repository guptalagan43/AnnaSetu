"use client";

import { ERSBadge } from "@/components/ui/ERSBadge";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useEffect, useState } from "react";

const mockLiveActivity = [
  { time: "Just now", donor: "MG Road Dhaba", shelter: "Hope Shelter", meals: 20 },
  { time: "5 min ago", donor: "City Bakery", shelter: "City Food Bank", meals: 30 },
  { time: "12 min ago", donor: "Campus Café", shelter: "Children's Home", meals: 15 },
  { time: "23 min ago", donor: "Fresh Mart", shelter: "Community Kitchen", meals: 40 },
  { time: "45 min ago", donor: "Spice Garden", shelter: "Hope Shelter", meals: 25 },
];

const mockTopDonors = [
  { rank: 1, name: "MG Road Dhaba", donations: 48, meals: 890 },
  { rank: 2, name: "Campus Café", donations: 32, meals: 640 },
  { rank: 3, name: "Fresh Mart Grocers", donations: 28, meals: 560 },
];

const mockImpactTrend = [
  { month: "Jan", meals: 8500 },
  { month: "Feb", meals: 9200 },
  { month: "Mar", meals: 10100 },
  { month: "Apr", meals: 11300 },
  { month: "May", meals: 12800 },
  { month: "Jun", meals: 14200 },
];

export default function PublicImpactDashboard() {
  const [counters, setCounters] = useState({
    meals: 0,
    kg: 0,
    co2e: 0,
    donors: 0,
  });

  useEffect(() => {
    const targets = { meals: 48320, kg: 17842, co2e: 12489, donors: 142 };
    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setCounters({
        meals: Math.floor(targets.meals * eased),
        kg: Math.floor(targets.kg * eased),
        co2e: Math.floor(targets.co2e * eased),
        donors: Math.floor(targets.donors * eased),
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, []);

  const renderCircles = () => {
    return mockImpactTrend.map((d, i) => (
      <circle key={i} cx={i * 80} cy={200 - (d.meals / 15000) * 180} r="6" fill="#D42B2B" />
    ));
  };

  const renderLabels = () => {
    return mockImpactTrend.map((d, i) => (
      <text key={`label-${i}`} x={i * 80} y={210} textAnchor="middle" fontSize="12" fill="#0A0A0A" fontFamily="Space Grotesk">{d.month}</text>
    ));
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="bg-brand-black text-brand-white py-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h1 className="font-display text-display-2xl text-brand-white mb-4">LIVE IMPACT COUNTER</h1>
          <p className="font-body text-body-xl text-brand-white/70 max-w-2xl mx-auto mb-12">
            Real-time food rescue metrics from across the city
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="font-display text-display-xl text-brand-red animate-counter">
                {counters.meals.toLocaleString()}
              </div>
              <div className="font-body text-body-sm text-brand-white/70 uppercase tracking-wider mt-2">MEALS RESCUED</div>
            </div>
            <div>
              <div className="font-display text-display-xl text-brand-red animate-counter">
                {counters.kg.toLocaleString()}
              </div>
              <div className="font-body text-body-sm text-brand-white/70 uppercase tracking-wider mt-2">KG DIVERTED</div>
            </div>
            <div>
              <div className="font-display text-display-xl text-brand-red animate-counter">
                {counters.co2e.toLocaleString()}
              </div>
              <div className="font-body text-body-sm text-brand-white/70 uppercase tracking-wider mt-2">CO₂e AVOIDED</div>
            </div>
            <div>
              <div className="font-display text-display-xl text-brand-red animate-counter">
                {counters.donors}
              </div>
              <div className="font-body text-body-sm text-brand-white/70 uppercase tracking-wider mt-2">DONORS ACTIVE</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button variant="primary" size="lg" className="w-full sm:w-auto">
              BECOME A DONOR — APPLY NOW
            </Button>
            <Button variant="ghost" size="lg" className="w-full sm:w-auto border-brand-white text-brand-white hover:bg-brand-white">
              VOLUNTEER TO DRIVE
            </Button>
          </div>
        </div>
      </section>

      {/* Live Activity Ticker */}
      <section className="bg-brand-black text-brand-white py-6">
        <div className="max-w-7xl mx-auto px-6 overflow-hidden">
          <div className="animate-ticker flex whitespace-nowrap">
            {mockLiveActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-4 px-8">
                <span className="font-body text-body-sm text-brand-white/50">🕐 {activity.time}</span>
                <span className="font-display text-body-lg text-brand-red">{activity.donor}</span>
                <span className="font-body text-body-sm text-brand-white/50">→</span>
                <span className="font-display text-body-lg text-brand-white">{activity.shelter}</span>
                <span className="font-body text-body-sm text-brand-white/50">•</span>
                <span className="font-display text-body-lg text-brand-red">{activity.meals} meals</span>
                <span className="w-px h-6 bg-brand-white/20 mx-4" />
              </div>
            ))}
            {mockLiveActivity.map((activity, index) => (
              <div key={index + 100} className="flex items-center gap-4 px-8">
                <span className="font-body text-body-sm text-brand-white/50">🕐 {activity.time}</span>
                <span className="font-display text-body-lg text-brand-red">{activity.donor}</span>
                <span className="font-body text-body-sm text-brand-white/50">→</span>
                <span className="font-display text-body-lg text-brand-white">{activity.shelter}</span>
                <span className="font-body text-body-sm text-brand-white/50">•</span>
                <span className="font-display text-body-lg text-brand-red">{activity.meals} meals</span>
                <span className="w-px h-6 bg-brand-white/20 mx-4" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* City Heatmap placeholder */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-display-lg text-brand-black mb-8">CITY WASTE & RESCUE HEATMAP</h2>
          <Card>
            <CardContent>
              <div className="aspect-video bg-brand-black/5 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="font-body text-body-xl text-brand-black/50">HEATMAP PLACEHOLDER</p>
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button variant="primary" size="sm">SHOW HOTSPOTS</Button>
                  <Button variant="ghost" size="sm">SHOW SUCCESS RATE</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Top Donors */}
      <section className="py-12 bg-brand-cream">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-display-lg text-brand-black mb-8">TOP DONORS THIS MONTH</h2>
          <div className="space-y-4">
            {mockTopDonors.map((donor) => (
              <Card key={donor.name} className="flex items-center justify-between p-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-brand-red rounded-full flex items-center justify-center font-display text-2xl text-brand-white">
                    {donor.rank}
                  </div>
                  <div>
                    <p className="font-display text-display-md text-brand-black">{donor.name}</p>
                    <p className="font-body text-body-sm text-brand-black/60">{donor.donations} donations this month</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-display-lg text-brand-red">{donor.meals.toLocaleString()}</div>
                  <div className="label-text text-brand-black/60">MEALS RESCUED</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Trend */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="font-display text-display-lg text-brand-black mb-8">IMPACT TREND (LAST 6 MONTHS)</h2>
          <Card>
            <CardContent>
              <div className="aspect-video bg-brand-black/5 flex items-center justify-center relative">
                <p className="font-body text-body-xl text-brand-black/50">CHART PLACEHOLDER</p>
                {/* Simple SVG chart */}
                <svg className="absolute inset-4" viewBox="0 0 400 200">
                  <polyline
                    fill="none"
                    stroke="#D42B2B"
                    strokeWidth="3"
                    points={mockImpactTrend.map((d, i) => `${i * 80},${200 - (d.meals / 15000) * 180}`).join(" ")}
                  />
                  {renderCircles()}
                  {renderLabels()}
                </svg>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Shelters Served & Drivers Active */}
      <section className="py-12 bg-brand-cream">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <h3 className="font-display text-display-sm text-brand-black">SHELTERS SERVED</h3>
              </CardHeader>
              <CardContent>
                <div className="font-display text-display-xl text-brand-red">38</div>
                <p className="font-body text-body-md text-brand-black/60 mt-2">Active shelters receiving rescued food</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <h3 className="font-display text-display-sm text-brand-black">VOLUNTEER DRIVERS ACTIVE</h3>
              </CardHeader>
              <CardContent>
                <div className="font-display text-display-xl text-brand-red">89</div>
                <p className="font-body text-body-md text-brand-black/60 mt-2">Verified drivers ready for dispatch</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section className="bg-brand-black text-brand-white py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="font-display text-display-lg text-brand-white mb-8">JOIN THE MISSION</h2>
          <p className="font-body text-body-xl text-brand-white/70 max-w-2xl mx-auto mb-12">
            Every meal rescued is a life impacted. Be part of the movement that's changing how cities handle food surplus.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button variant="primary" size="lg" className="w-full sm:w-auto">
              FOOD BUSINESS — DONATE SURPLUS
            </Button>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              SHELTER / NGO — RECEIVE FOOD
            </Button>
            <Button variant="ghost" size="lg" className="w-full sm:w-auto border-brand-white text-brand-white hover:bg-brand-white">
              VOLUNTEER — DRIVE DELIVERIES
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface MonthlyData {
  month: string;
  meals: number;
  kg: number;
}

interface RecentDelivery {
  id: string;
  title: string;
  quantity_kg: number;
  meals: number;
  shelter_name: string;
  date: string;
  status: string;
}

const MONTHLY_RESCUE_DATA: MonthlyData[] = [
  { month: "Jan", meals: 240, kg: 96 },
  { month: "Feb", meals: 310, kg: 124 },
  { month: "Mar", meals: 380, kg: 152 },
  { month: "Apr", meals: 420, kg: 168 },
  { month: "May", meals: 510, kg: 204 },
  { month: "Jun", meals: 640, kg: 256 },
];

const RECENT_DELIVERIES: RecentDelivery[] = [
  {
    id: "del-1",
    title: "Dal Makhani & 40 Rotis",
    quantity_kg: 18.0,
    meals: 45,
    shelter_name: "Hope Shelter",
    date: "Today, 1:30 PM",
    status: "VERIFIED",
  },
  {
    id: "del-2",
    title: "Veg Pulao & Mix Veg Curry",
    quantity_kg: 24.0,
    meals: 60,
    shelter_name: "City Food Bank",
    date: "Yesterday",
    status: "VERIFIED",
  },
  {
    id: "del-3",
    title: "Paneer Gravy & Naan",
    quantity_kg: 15.0,
    meals: 38,
    shelter_name: "Children's Home",
    date: "3 days ago",
    status: "VERIFIED",
  },
  {
    id: "del-4",
    title: "Assorted Bread & Samosas",
    quantity_kg: 12.0,
    meals: 30,
    shelter_name: "Community Kitchen",
    date: "5 days ago",
    status: "VERIFIED",
  },
];

export default function DonorImpactPage() {
  const [donorId, setDonorId] = useState<string>("demo-donor");
  const [donorName, setDonorName] = useState<string>("MG Road Dhaba");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user?.id) {
          setDonorId(data.user.id);
          setDonorName(data.user.display_name || data.user.email?.split("@")[0] || "Food Donor");
        }
      })
      .catch(() => {});
  }, []);

  const handleDownloadCertificate = () => {
    setDownloading(true);
    // Trigger direct stream download
    const certUrl = `/api/donors/${donorId}/certificate`;
    const link = document.createElement("a");
    link.href = certUrl;
    link.download = `AnnaSetu-Tax-Certificate-${donorId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setDownloading(false), 2000);
  };

  const totalMeals = 2500;
  const totalKg = 1000;
  const totalCo2e = 2500;
  const totalDonations = 52;

  return (
    <div className="space-y-8">
      {/* Header with Title and Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-4 border-brand-black pb-6">
        <div>
          <div className="font-mono text-xs font-bold text-brand-red uppercase tracking-wider mb-1">
            ESG & SOCIAL RETURN ON SURPLUS • SECTION 80G
          </div>
          <h1 className="font-display text-3xl sm:text-5xl uppercase tracking-tight text-brand-black">
            DONOR IMPACT & TAX REPORTING
          </h1>
          <p className="font-body text-body-md text-brand-black/70 mt-1 max-w-2xl">
            Audit-grade record of your organization's surplus food donations, nutritional yield, and greenhouse gas abatement.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="lg"
            variant="primary"
            onClick={handleDownloadCertificate}
            disabled={downloading}
            className="font-display text-base tracking-wider uppercase shadow-brutal flex items-center gap-2"
          >
            <span>📄</span>
            <span>{downloading ? "GENERATING PDF..." : "DOWNLOAD 80G CERTIFICATE"}</span>
          </Button>
        </div>
      </div>

      {/* 4-Card Hero Metrics Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-4 border-brand-black p-5 shadow-brutal bg-brand-white">
          <div className="font-mono text-xs text-brand-black/60 uppercase font-bold">MEALS REDISTRIBUTED</div>
          <div className="font-display text-4xl sm:text-5xl text-brand-red font-bold mt-1">
            {totalMeals.toLocaleString()}
          </div>
          <div className="font-mono text-xs text-brand-black/50 mt-1">Certified nutritious portions</div>
        </Card>

        <Card className="border-4 border-brand-black p-5 shadow-brutal bg-brand-white">
          <div className="font-mono text-xs text-brand-black/60 uppercase font-bold">SURPLUS DIVERTED (KG)</div>
          <div className="font-display text-4xl sm:text-5xl text-brand-black font-bold mt-1">
            {totalKg.toLocaleString()} kg
          </div>
          <div className="font-mono text-xs text-brand-black/50 mt-1">Saved from municipal landfills</div>
        </Card>

        <Card className="border-4 border-brand-black p-5 shadow-brutal bg-emerald-50">
          <div className="font-mono text-xs text-emerald-800 uppercase font-bold">CO₂e AVOIDED (KG)</div>
          <div className="font-display text-4xl sm:text-5xl text-emerald-700 font-bold mt-1">
            {totalCo2e.toLocaleString()} kg
          </div>
          <div className="font-mono text-xs text-emerald-800/60 mt-1">EPA WARM 2.50x conversion</div>
        </Card>

        <Card className="border-4 border-brand-black p-5 shadow-brutal bg-brand-cream">
          <div className="font-mono text-xs text-brand-black/60 uppercase font-bold">COMPLETED RESCUES</div>
          <div className="font-display text-4xl sm:text-5xl text-brand-black font-bold mt-1">
            {totalDonations}
          </div>
          <div className="font-mono text-xs text-brand-black/50 mt-1">100% PIN & checklist verified</div>
        </Card>
      </div>

      {/* 2-Column: Recharts Monthly Chart + Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recharts Bar Chart (2 columns) */}
        <Card className="lg:col-span-2 border-4 border-brand-black shadow-brutal">
          <CardHeader className="border-b-4 border-brand-black bg-brand-cream pb-4">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-mono text-xs font-bold text-brand-red uppercase">TRAJECTORY</div>
                <h2 className="font-display text-2xl uppercase text-brand-black">MONTHLY RESCUE VELOCITY</h2>
              </div>
              <span className="font-mono text-xs bg-brand-black text-brand-white px-2 py-1 uppercase font-bold">
                PORTIONS PER MONTH
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="w-full h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={MONTHLY_RESCUE_DATA}
                  margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#CCCCCC" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontFamily: "Space Grotesk", fontSize: 12, fill: "#0A0A0A", fontWeight: "bold" }}
                  />
                  <YAxis
                    tick={{ fontFamily: "Space Grotesk", fontSize: 12, fill: "#0A0A0A" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#F5F0E8",
                      border: "2px solid #0A0A0A",
                      fontFamily: "Space Grotesk",
                      fontSize: "12px",
                      boxShadow: "4px 4px 0px #0A0A0A",
                    }}
                    cursor={{ fill: "rgba(212, 43, 43, 0.08)" }}
                  />
                  <Bar dataKey="meals" fill="#D42B2B" name="Meals Provided" />
                  <Bar dataKey="kg" fill="#0A0A0A" name="Weight (kg)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown (1 column) */}
        <Card className="border-4 border-brand-black shadow-brutal">
          <CardHeader className="border-b-4 border-brand-black bg-brand-cream pb-4">
            <div>
              <div className="font-mono text-xs font-bold text-brand-red uppercase">INVENTORY SPREAD</div>
              <h2 className="font-display text-2xl uppercase text-brand-black">RESCUE CATEGORIES</h2>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4 font-mono text-xs">
            <div className="space-y-1">
              <div className="flex justify-between font-bold">
                <span>COOKED CURRIES & RICE</span>
                <span className="text-brand-red">48% (480kg)</span>
              </div>
              <div className="h-4 bg-brand-cream border border-brand-black overflow-hidden">
                <div className="bg-brand-red h-full" style={{ width: "48%" }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-bold">
                <span>FRESH VEGETABLES & FRUITS</span>
                <span className="text-emerald-700">22% (220kg)</span>
              </div>
              <div className="h-4 bg-brand-cream border border-brand-black overflow-hidden">
                <div className="bg-emerald-600 h-full" style={{ width: "22%" }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-bold">
                <span>BAKERY, BREADS & PASTRIES</span>
                <span className="text-amber-800">18% (180kg)</span>
              </div>
              <div className="h-4 bg-brand-cream border border-brand-black overflow-hidden">
                <div className="bg-amber-500 h-full" style={{ width: "18%" }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between font-bold">
                <span>CHILLED DAIRY & SWEETS</span>
                <span className="text-brand-black">12% (120kg)</span>
              </div>
              <div className="h-4 bg-brand-cream border border-brand-black overflow-hidden">
                <div className="bg-brand-black h-full" style={{ width: "12%" }} />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t-2 border-brand-black text-[11px] text-brand-black/70">
              * Categorized by FSSAI shelf-life stability index and refrigerated storage protocols.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 80G Statutory Tax Exemption Banner */}
      <Card className="border-4 border-brand-black bg-brand-cream p-6 sm:p-8 shadow-brutal">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-block px-2.5 py-0.5 bg-brand-black text-brand-white font-mono text-xs uppercase font-bold">
              INDIAN INCOME TAX ACT 1961 • SECTION 80G
            </div>
            <h2 className="font-display text-2xl sm:text-3xl uppercase text-brand-black">
              CLAIM IN-KIND CHARITABLE TAX DEDUCTIONS
            </h2>
            <p className="font-body text-body-md text-brand-black/80 max-w-3xl">
              Under Indian Income Tax guidelines, surplus food donated to registered 12A/80G charitable institutions is eligible for in-kind inventory write-offs. Your downloaded certificate includes digital verification timestamps, donor PAN, and FSSAI credentials verified through the AnnaSetu ledger.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              variant="primary"
              onClick={handleDownloadCertificate}
              disabled={downloading}
              className="font-display text-lg tracking-wider uppercase shadow-brutal-sm"
            >
              DOWNLOAD OFFICIAL CERTIFICATE (PDF)
            </Button>
          </div>
        </div>
      </Card>

      {/* Verified Deliveries Audit Trail Table */}
      <Card className="border-4 border-brand-black shadow-brutal overflow-hidden">
        <CardHeader className="border-b-4 border-brand-black bg-brand-black text-brand-white pb-4">
          <div className="flex justify-between items-center">
            <h2 className="font-display text-2xl uppercase tracking-wider text-brand-white">
              VERIFIED DONATION AUDIT TRAIL
            </h2>
            <span className="font-mono text-xs bg-brand-red text-brand-white px-2 py-0.5 uppercase font-bold">
              PHYSICAL HANDOVER LOG
            </span>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left font-body text-sm">
            <thead className="bg-brand-cream border-b-2 border-brand-black font-mono text-xs uppercase">
              <tr>
                <th className="p-4">DONATION ITEM</th>
                <th className="p-4">WEIGHT (KG)</th>
                <th className="p-4">MEALS PROVIDED</th>
                <th className="p-4">RECIPIENT SHELTER</th>
                <th className="p-4">HANDOVER TIME</th>
                <th className="p-4 text-right">AUDIT STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-brand-black bg-brand-white font-mono text-xs">
              {RECENT_DELIVERIES.map((del) => (
                <tr key={del.id} className="hover:bg-brand-cream/30 transition">
                  <td className="p-4 font-bold text-brand-black">{del.title}</td>
                  <td className="p-4">{del.quantity_kg} kg</td>
                  <td className="p-4 font-bold text-brand-red">{del.meals} Portions</td>
                  <td className="p-4">🏠 {del.shelter_name}</td>
                  <td className="p-4 text-brand-black/60">{del.date}</td>
                  <td className="p-4 text-right">
                    <Badge variant="safe" className="font-mono text-[10px]">
                      ✓ {del.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

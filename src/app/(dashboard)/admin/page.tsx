"use client";

import { ERSBadge } from "@/components/ui/ERSBadge";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

const mockAgentLog = [
  { time: "10:42", action: "AUTO_ASSIGN_DRIVER", listing: "L-042", target: "Priya S.", ers: 84, confidence: 0.92 },
  { time: "10:38", action: "AUTO_CONFIRM_SHELTER", listing: "L-041", target: "Hope Shelter", ers: 79, confidence: 0.87 },
  { time: "10:21", action: "RE_DISPATCH", listing: "L-039", target: "Arjun K.", ers: 88, confidence: 0.95 },
  { time: "09:55", action: "ESCALATE_TO_ADMIN", listing: "L-031", target: "—", ers: 91, confidence: 0.78 },
];

const mockWasteEvents = [
  { food: "Biryani × 25", location: "Andheri West", time: "8:30 PM", reason: "No driver available" },
  { food: "Dal × 10", location: "Powai", time: "7:10 PM", reason: "Shelter declined, no fallback" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="font-display text-display-lg text-brand-black">ADMIN DASHBOARD</h1>
        <p className="font-body text-body-md text-brand-black/60 mt-1">Platform operations & oversight</p>
      </header>

      {/* Platform Health */}
      <section>
        <h2 className="font-display text-display-md text-brand-black mb-6">PLATFORM HEALTH (LIVE)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6 mb-8">
          <Card>
            <CardContent className="text-center">
              <div className="font-display text-display-xl text-brand-red">12</div>
              <div className="label-text text-brand-black/60">ACTIVE LISTINGS</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <div className="font-display text-display-xl text-brand-red">3</div>
              <div className="label-text text-brand-black/60 text-brand-red">CRITICAL (ERS {'>'} 80)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <div className="font-display text-display-xl text-brand-red">8</div>
              <div className="label-text text-brand-black/60">DRIVERS ONLINE</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <div className="font-display text-display-xl text-brand-red">14</div>
              <div className="label-text text-brand-black/60">SHELTERS AVAILABLE</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <div className="font-display text-display-xl text-brand-red">1</div>
              <div className="label-text text-brand-black/60 text-brand-red">NEEDS INTERVENTION</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <div className="font-display text-display-xl text-brand-red">2</div>
              <div className="label-text text-brand-black/60">WASTE EVENTS TODAY</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <div className="font-display text-display-xl text-brand-red">1</div>
              <div className="label-text text-brand-black/60 text-brand-red">DISPUTED DELIVERIES</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <div className="font-display text-display-xl text-brand-red">1</div>
              <div className="label-text text-brand-black/60 text-brand-red">VIOLATIONS PENDING</div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Verification Queue */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-display-md text-brand-black">VERIFICATION QUEUE</h2>
              <Button variant="ghost" size="sm">VIEW ALL →</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border-2 border-brand-black">
                <div>
                  <p className="font-display text-display-sm text-brand-black">Green Grocers</p>
                  <p className="font-body text-body-sm text-brand-black/60">Grocery Store · FSSAI: 10025064001150 · Submitted 2 hrs ago</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="caution">PENDING REVIEW</Badge>
                  <Button variant="primary" size="sm">REVIEW</Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border-2 border-brand-black">
                <div>
                  <p className="font-display text-display-sm text-brand-black">Campus Canteen</p>
                  <p className="font-body text-body-sm text-brand-black/60">Campus Dining · FSSAI: 10025064001151 · Submitted 4 hrs ago</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="caution">PENDING REVIEW</Badge>
                  <Button variant="primary" size="sm">REVIEW</Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border-2 border-brand-black">
                <div>
                  <p className="font-display text-display-sm text-brand-black">Fresh Mart</p>
                  <p className="font-body text-body-sm text-brand-black/60">Grocery Store · FSSAI: 10025064001152 · Submitted 1 day ago</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning">UNDER REVIEW</Badge>
                  <Button variant="secondary" size="sm">CONTINUE</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Live Listings Map placeholder */}
        <Card>
          <CardHeader>
            <h2 className="font-display text-display-md text-brand-black">LIVE LISTINGS MAP</h2>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-brand-black/5 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="font-body text-body-lg text-brand-white/50">MAP PLACEHOLDER</p>
              </div>
              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button variant="ghost" size="sm">ALL</Button>
<Button variant="primary" size="sm">ERS {'>'}60</Button>
<Button variant="ghost" size="sm">ERS {'>'}80</Button>
                <Button variant="ghost" size="sm">UNMATCHED</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Agentic Dispatcher Log */}
      <section>
        <h2 className="font-display text-display-md text-brand-black mb-6">AGENTIC DISPATCHER LOG</h2>
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>TIME</th>
                    <th>ACTION</th>
                    <th>LISTING</th>
                    <th>TARGET</th>
                    <th>ERS</th>
                    <th>CONFIDENCE</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {mockAgentLog.map((log, index) => (
                    <tr key={index}>
                      <td className="font-mono font-bold">{log.time}</td>
                      <td>
                        <Badge variant={log.action.includes("ESCALATE") ? "emergency" : log.action.includes("AUTO_CONFIRM") ? "critical" : "warning"}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="font-mono">{log.listing}</td>
                      <td>{log.target}</td>
                      <td><ERSBadge score={log.ers} size="sm" showLabel={false} /></td>
                      <td className="font-mono">{Math.round(log.confidence * 100)}%</td>
                      <td>
                        <Button variant="ghost" size="sm">OVERRIDE</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CardFooter>
              <Button variant="ghost" size="sm">VIEW FULL LOG →</Button>
            </CardFooter>
          </CardContent>
        </Card>
      </section>

      {/* Waste Events */}
      <section className="mt-8">
        <h2 className="font-display text-display-md text-brand-black mb-6">WASTE EVENTS TODAY (FAILED RESCUES)</h2>
        <Card>
          <CardContent>
            <div className="space-y-4">
              {mockWasteEvents.map((event, index) => (
                <div key={index} className="flex items-center justify-between p-4 border-2 border-brand-black bg-brand-white/50">
                  <div>
                    <p className="font-display text-display-sm text-brand-black">{event.food}</p>
                    <p className="font-body text-body-sm text-brand-black/60">{event.location} · {event.time} · {event.reason}</p>
                  </div>
                  <Badge variant="emergency">WASTED</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Platform Metrics placeholder */}
      <section className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card>
          <CardHeader>
            <h3 className="font-display text-display-sm text-brand-black">DAILY MEALS VS WASTE</h3>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-brand-black/5 flex items-center justify-center">
              <p className="font-body text-body-lg text-brand-white/50">CHART PLACEHOLDER</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="font-display text-display-sm text-brand-black">AVG ERS AT MATCH</h3>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-brand-black/5 flex items-center justify-center">
              <p className="font-body text-body-lg text-brand-white/50">CHART PLACEHOLDER</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h3 className="font-display text-display-sm text-brand-black">LISTINGS BY CATEGORY</h3>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-brand-black/5 flex items-center justify-center">
              <p className="font-body text-body-lg text-brand-white/50">CHART PLACEHOLDER</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
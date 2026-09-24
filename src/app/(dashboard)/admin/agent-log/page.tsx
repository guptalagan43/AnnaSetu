"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import type { AgentLogRecord } from "@/lib/dispatcher/override";

const ACTION_CONFIG: Record<
  string,
  { label: string; badgeVariant: "safe" | "caution" | "warning" | "critical" | "emergency" | "default" }
> = {
  AUTO_CONFIRM_SHELTER: { label: "AUTO CONFIRM SHELTER", badgeVariant: "safe" },
  ASSIGN_DRIVER: { label: "ASSIGN DRIVER", badgeVariant: "warning" },
  ESCALATE_TO_ADMIN: { label: "ESCALATE TO ADMIN", badgeVariant: "emergency" },
  SKIP_ALREADY_ACTIONED: { label: "IDEMPOTENCY SKIP", badgeVariant: "default" },
};

export default function AdminAgentLogPage() {
  const [logs, setLogs] = useState<AgentLogRecord[]>([]);
  const [stats, setStats] = useState({
    total_actions: 0,
    auto_confirmed: 0,
    drivers_assigned: 0,
    escalated: 0,
    overridden: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("ALL");
  const [overrideFilter, setOverrideFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Override Modal state
  const [selectedLog, setSelectedLog] = useState<AgentLogRecord | null>(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideSubmitting, setOverrideSubmitting] = useState(false);
  const [overrideError, setOverrideError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter !== "ALL") params.set("action", actionFilter);
      if (overrideFilter === "OVERRIDDEN") params.set("overridden", "true");
      if (overrideFilter === "ACTIVE") params.set("overridden", "false");

      const res = await fetch(`/api/admin/agent-log?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch agent logs");
      const json = await res.json();
      if (json.data) {
        setLogs(json.data.logs || []);
        if (json.data.stats) {
          setStats(json.data.stats);
        }
      }
    } catch (err) {
      console.error("[Agent Log Page] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, overrideFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleOpenOverride = (log: AgentLogRecord) => {
    setSelectedLog(log);
    setOverrideReason("");
    setOverrideError(null);
  };

  const handleConfirmOverride = async () => {
    if (!selectedLog) return;
    if (overrideReason.trim().length < 5) {
      setOverrideError("Please provide an explanation of at least 5 characters");
      return;
    }

    setOverrideSubmitting(true);
    setOverrideError(null);

    try {
      const res = await fetch(`/api/admin/agent-log/${selectedLog.id}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: overrideReason.trim() }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Override request failed");
      }

      setSuccessToast(`Action overridden successfully: ${selectedLog.action}`);
      setTimeout(() => setSuccessToast(null), 4000);
      setSelectedLog(null);
      fetchLogs();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error executing override";
      setOverrideError(msg);
    } finally {
      setOverrideSubmitting(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      (log.listing_title && log.listing_title.toLowerCase().includes(q)) ||
      (log.shelter_name && log.shelter_name.toLowerCase().includes(q)) ||
      (log.reasoning && log.reasoning.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b-4 border-brand-black pb-6">
        <div>
          <div className="font-mono text-xs font-bold text-brand-red uppercase tracking-wider mb-1">
            AUTONOMOUS DISPATCH SUPERVISION • SRS §14
          </div>
          <h1 className="font-display text-3xl sm:text-5xl uppercase tracking-tight text-brand-black">
            AGENTIC DISPATCHER LOG
          </h1>
          <p className="font-body text-body-md text-brand-black/70 mt-1 max-w-2xl">
            Audit trail of all autonomous decisions made by the Gemini-assisted dispatcher. Every decision can be reviewed and reversed by administrators.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchLogs}
            disabled={loading}
            className="font-mono text-xs uppercase"
          >
            {loading ? "REFRESHING..." : "⟳ REFRESH LOGS"}
          </Button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="bg-emerald-500 text-brand-black border-4 border-brand-black p-4 font-mono text-sm font-bold shadow-brutal flex items-center justify-between animate-fade-in">
          <span>✓ {successToast}</span>
          <button onClick={() => setSuccessToast(null)} className="text-xl leading-none">×</button>
        </div>
      )}

      {/* Summary KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-3 border-brand-black p-4 shadow-brutal-sm bg-brand-white">
          <div className="font-mono text-[10px] text-brand-black/60 uppercase font-bold">TOTAL DISPATCHES</div>
          <div className="font-display text-3xl text-brand-black font-bold mt-1">{stats.total_actions}</div>
          <div className="font-mono text-[10px] text-brand-black/50">All recorded actions</div>
        </Card>

        <Card className="border-3 border-brand-black p-4 shadow-brutal-sm bg-emerald-50">
          <div className="font-mono text-[10px] text-emerald-800 uppercase font-bold">AUTO CONFIRMED</div>
          <div className="font-display text-3xl text-emerald-700 font-bold mt-1">{stats.auto_confirmed}</div>
          <div className="font-mono text-[10px] text-emerald-800/60">ERS &gt; 80 timeouts</div>
        </Card>

        <Card className="border-3 border-brand-black p-4 shadow-brutal-sm bg-amber-50">
          <div className="font-mono text-[10px] text-amber-900 uppercase font-bold">DRIVERS ASSIGNED</div>
          <div className="font-display text-3xl text-amber-700 font-bold mt-1">{stats.drivers_assigned}</div>
          <div className="font-mono text-[10px] text-amber-900/60">Volunteer dispatches</div>
        </Card>

        <Card className="border-3 border-brand-black p-4 shadow-brutal-sm bg-red-50">
          <div className="font-mono text-[10px] text-brand-red uppercase font-bold">ADMIN ESCALATIONS</div>
          <div className="font-display text-3xl text-brand-red font-bold mt-1">{stats.escalated}</div>
          <div className="font-mono text-[10px] text-red-900/60">Human alerts sent</div>
        </Card>

        <Card className="border-3 border-brand-black p-4 shadow-brutal-sm bg-brand-black text-brand-white">
          <div className="font-mono text-[10px] text-brand-white/70 uppercase font-bold">OVERRIDDEN</div>
          <div className="font-display text-3xl text-brand-yellow font-bold mt-1">{stats.overridden}</div>
          <div className="font-mono text-[10px] text-brand-white/60">Manual reversals</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-3 border-brand-black shadow-brutal-sm bg-brand-cream/60">
        <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Action Type Dropdown */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase text-brand-black/70">Action:</span>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-brand-white border-2 border-brand-black px-3 py-1.5 font-mono text-xs font-bold uppercase focus:outline-none shadow-brutal-xs"
              >
                <option value="ALL">ALL ACTIONS</option>
                <option value="AUTO_CONFIRM_SHELTER">AUTO CONFIRM SHELTER</option>
                <option value="ASSIGN_DRIVER">ASSIGN DRIVER</option>
                <option value="ESCALATE_TO_ADMIN">ESCALATE TO ADMIN</option>
                <option value="SKIP_ALREADY_ACTIONED">IDEMPOTENCY SKIP</option>
              </select>
            </div>

            {/* Override Filter */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold uppercase text-brand-black/70">Status:</span>
              <select
                value={overrideFilter}
                onChange={(e) => setOverrideFilter(e.target.value)}
                className="bg-brand-white border-2 border-brand-black px-3 py-1.5 font-mono text-xs font-bold uppercase focus:outline-none shadow-brutal-xs"
              >
                <option value="ALL">ALL STATUSES</option>
                <option value="ACTIVE">ACTIVE ACTIONS</option>
                <option value="OVERRIDDEN">OVERRIDDEN ONLY</option>
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="w-full md:w-72">
            <input
              type="text"
              placeholder="Search listings, shelters, reasoning..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-white border-2 border-brand-black px-3 py-1.5 font-mono text-xs focus:outline-none shadow-brutal-xs"
            />
          </div>
        </div>
      </Card>

      {/* Main Agent Logs Table */}
      <Card className="border-4 border-brand-black shadow-brutal overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left font-body text-sm">
            <thead className="bg-brand-black text-brand-white font-mono text-xs uppercase border-b-4 border-brand-black">
              <tr>
                <th className="p-4 font-bold">TIMESTAMP</th>
                <th className="p-4 font-bold">ACTION TYPE</th>
                <th className="p-4 font-bold">LISTING DETAILS</th>
                <th className="p-4 font-bold">ASSIGNED TARGET</th>
                <th className="p-4 font-bold min-w-[280px]">AI REASONING & CONFIDENCE</th>
                <th className="p-4 font-bold text-center">OVERRIDE STATUS</th>
                <th className="p-4 font-bold text-right">MANUAL ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-brand-black bg-brand-white">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center font-mono text-brand-black/50">
                    Loading agentic dispatcher decisions...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center font-mono text-brand-black/50">
                    No dispatcher actions matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const actionMeta = ACTION_CONFIG[log.action] || {
                    label: log.action,
                    badgeVariant: "default",
                  };
                  const isOverridden = Boolean(log.overridden_at);
                  const isSkippable = log.action === "SKIP_ALREADY_ACTIONED";

                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-brand-cream/40 transition ${
                        isOverridden ? "bg-amber-50/40" : ""
                      }`}
                    >
                      {/* Timestamp */}
                      <td className="p-4 font-mono text-xs text-brand-black/70 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                        <div className="text-[10px] text-brand-black/40">
                          {new Date(log.created_at).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </td>

                      {/* Action Badge */}
                      <td className="p-4 whitespace-nowrap">
                        <Badge variant={actionMeta.badgeVariant} className="font-mono text-[11px]">
                          {actionMeta.label}
                        </Badge>
                      </td>

                      {/* Listing Details */}
                      <td className="p-4">
                        <div className="font-display text-base text-brand-black uppercase leading-tight">
                          {log.listing_title || "Surplus Batch"}
                        </div>
                        <div className="font-mono text-xs text-brand-black/60 flex items-center gap-2 mt-0.5">
                          <span>{log.listing_quantity_kg ? `${log.listing_quantity_kg}kg` : "—"}</span>
                          {log.listing_ers && (
                            <span
                              className={`px-1 text-[10px] font-bold ${
                                log.listing_ers >= 80
                                  ? "bg-brand-red text-brand-white"
                                  : "bg-brand-black text-brand-white"
                              }`}
                            >
                              ERS {log.listing_ers}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Target (Shelter or Driver) */}
                      <td className="p-4 font-mono text-xs">
                        {log.shelter_name && (
                          <div className="text-brand-black font-semibold">
                            🏠 {log.shelter_name}
                          </div>
                        )}
                        {log.driver_name && (
                          <div className="text-brand-black font-semibold mt-0.5">
                            🚗 {log.driver_name}
                          </div>
                        )}
                        {!log.shelter_name && !log.driver_name && (
                          <span className="text-brand-black/40 italic">None / Escalated</span>
                        )}
                      </td>

                      {/* Reasoning + Confidence */}
                      <td className="p-4 text-xs font-mono">
                        <div className="text-brand-black/80 line-clamp-3 leading-relaxed">
                          {log.reasoning || "Automated threshold criteria satisfied."}
                        </div>
                        {typeof log.confidence === "number" && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] font-bold text-brand-black/60">CONFIDENCE:</span>
                            <div className="w-20 h-2 bg-brand-cream border border-brand-black overflow-hidden">
                              <div
                                className={`h-full ${
                                  log.confidence >= 0.7
                                    ? "bg-emerald-500"
                                    : log.confidence >= 0.5
                                    ? "bg-amber-500"
                                    : "bg-brand-red"
                                }`}
                                style={{ width: `${Math.round(log.confidence * 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold">{Math.round(log.confidence * 100)}%</span>
                          </div>
                        )}
                      </td>

                      {/* Override Status */}
                      <td className="p-4 text-center whitespace-nowrap">
                        {isOverridden ? (
                          <div>
                            <span className="inline-block px-2 py-0.5 bg-amber-400 border border-brand-black font-mono text-[10px] font-bold text-brand-black uppercase">
                              REVERSED
                            </span>
                            <div className="font-mono text-[10px] text-brand-black/50 mt-1">
                              by {log.admin_name || "Admin"}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-block px-2 py-0.5 bg-emerald-100 border border-emerald-500 font-mono text-[10px] font-bold text-emerald-800 uppercase">
                            ACTIVE
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="p-4 text-right whitespace-nowrap">
                        {isOverridden ? (
                          <span className="font-mono text-xs text-brand-black/40 uppercase">
                            OVERRIDDEN
                          </span>
                        ) : isSkippable ? (
                          <span className="font-mono text-xs text-brand-black/40 uppercase">
                            N/A
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleOpenOverride(log)}
                            className="font-mono text-xs uppercase"
                          >
                            OVERRIDE ⚡
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Override Confirmation Modal */}
      {selectedLog && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedLog(null)}
          title="ADMIN OVERRIDE CONFIRMATION"
        >
          <div className="space-y-4">
            <div className="p-3 bg-amber-100 border-2 border-brand-black font-mono text-xs text-brand-black">
              <strong>WARNING:</strong> Overriding this autonomous decision will immediately cancel the active match or driver assignment, revert the food listing to available status, and send priority email alerts to all participants.
            </div>

            <div className="border-2 border-brand-black p-3 bg-brand-cream/40 font-mono text-xs space-y-1.5">
              <div>
                <span className="text-brand-black/60 font-bold uppercase">Action to reverse: </span>
                <span className="font-bold text-brand-red">{selectedLog.action}</span>
              </div>
              <div>
                <span className="text-brand-black/60 font-bold uppercase">Listing: </span>
                <span className="font-bold text-brand-black">{selectedLog.listing_title || selectedLog.listing_id}</span>
              </div>
              {selectedLog.shelter_name && (
                <div>
                  <span className="text-brand-black/60 font-bold uppercase">Assigned Shelter: </span>
                  <span className="font-bold text-brand-black">{selectedLog.shelter_name}</span>
                </div>
              )}
              {selectedLog.driver_name && (
                <div>
                  <span className="text-brand-black/60 font-bold uppercase">Assigned Driver: </span>
                  <span className="font-bold text-brand-black">{selectedLog.driver_name}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block font-mono text-xs font-bold uppercase text-brand-black mb-1">
                Reason for Override (Required — min 5 chars):
              </label>
              <textarea
                rows={3}
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Shelter coordinator phoned unable to take dairy batch; re-routing to Community Kitchen."
                className="w-full border-2 border-brand-black p-2 font-mono text-xs focus:outline-none shadow-brutal-xs"
              />
            </div>

            {overrideError && (
              <div className="p-2 bg-red-100 border border-brand-red font-mono text-xs text-brand-red font-bold">
                ⚠ {overrideError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setSelectedLog(null)}
                disabled={overrideSubmitting}
                className="font-mono text-xs uppercase"
              >
                CANCEL
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmOverride}
                disabled={overrideSubmitting || overrideReason.trim().length < 5}
                className="font-mono text-xs uppercase"
              >
                {overrideSubmitting ? "REVERSING..." : "CONFIRM OVERRIDE ⚡"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

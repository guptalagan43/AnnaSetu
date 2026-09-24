"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { format } from "date-fns";

interface Verification {
  id: string;
  business_name: string;
  business_type: string;
  contact_person_name: string;
  contact_email: string;
  contact_phone: string;
  fssai_number: string;
  fssai_expiry: string;
  status: string;
  submitted_at: string;
  city: string;
  state: string;
  avg_daily_surplus: string | null;
}

interface VerificationListResponse {
  data: {
    items: Verification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const statusConfig: Record<string, { variant: "safe" | "caution" | "warning" | "critical" | "emergency" | "default"; label: string }> = {
  pending_review: { variant: "caution", label: "PENDING REVIEW" },
  under_review: { variant: "warning", label: "UNDER REVIEW" },
  approved: { variant: "safe", label: "APPROVED" },
  rejected: { variant: "emergency", label: "REJECTED" },
};

const businessTypes: Record<string, string> = {
  restaurant: "Restaurant",
  grocery_store: "Grocery Store",
  caterer: "Caterer",
  campus_dining: "Campus Dining",
  cloud_kitchen: "Cloud Kitchen",
  other: "Other",
};

const surplusLabels: Record<string, string> = {
  "<5kg": "< 5 kg",
  "5-20kg": "5–20 kg",
  "20-50kg": "20–50 kg",
  "50kg+": "50 kg+",
};

export default function AdminVerificationQueuePage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending_review");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchVerifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: currentPage.toString(),
        limit: "20",
      });
      if (searchQuery) {
        params.set("search", searchQuery);
      }

      const res = await fetch(`/api/verification?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error((json as { error?: string }).error || "Failed to fetch verifications");
      }

      setVerifications((json as VerificationListResponse).data.items);
      setTotalCount((json as VerificationListResponse).data.total);
      setTotalPages((json as VerificationListResponse).data.totalPages);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("[Admin Verification Queue] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, currentPage]);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchVerifications();
  };

  const getFssaiExpiryWarning = (expiry: string) => {
    const expiryDate = new Date(expiry);
    const daysUntilExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry < 90;
  };

  const getFssaiDaysUntilExpiry = (expiry: string) => {
    const expiryDate = new Date(expiry);
    return Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <h1 className="font-display text-display-lg text-brand-black">VERIFICATION QUEUE</h1>
        <p className="font-body text-body-md text-brand-black/60 mt-1">
          Review and approve donor verification applications
        </p>
      </header>

      {/* Filters */}
      <Card variant="default">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1 md:w-64">
              <Input
                placeholder="Search by business name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                label="SEARCH"
              />
            </div>
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-brand-white text-brand-black border-2 border-brand-black px-4 py-3 text-body-md font-body font-medium uppercase tracking-wider focus:outline-none focus:border-brand-red focus:shadow-[2px_2px_0px_0px_#D42B2B] appearance-none"
              >
                <option value="pending_review">PENDING REVIEW</option>
                <option value="under_review">UNDER REVIEW</option>
                <option value="approved">APPROVED</option>
                <option value="rejected">REJECTED</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-brand-black/50">
                {totalCount} total
              </span>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error state */}
      {error && (
        <Card variant="default">
          <CardContent className="p-6 text-center">
            <p className="font-body text-body-md text-brand-red">Error: {error}</p>
            <Button variant="secondary" size="sm" onClick={fetchVerifications} className="mt-4">
              RETRY
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card variant="elevated">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center">
              <div className="font-body text-body-lg text-brand-black/50">Loading verifications…</div>
            </div>
          ) : verifications.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-body text-body-lg text-brand-black/50">No verifications found</p>
              <p className="font-body text-body-sm text-brand-black/40 mt-2">
                {statusFilter === "pending_review"
                  ? "No pending applications — great job!"
                  : `No applications with status "${statusFilter}"`}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full data-table">
                  <thead>
                    <tr>
                      <th className="px-6 py-4 text-left">BUSINESS</th>
                      <th className="px-6 py-4 text-left">TYPE</th>
                      <th className="px-6 py-4 text-left">CONTACT</th>
                      <th className="px-6 py-4 text-left">FSSAI</th>
                      <th className="px-6 py-4 text-left">LOCATION</th>
                      <th className="px-6 py-4 text-left">SURPLUS</th>
                      <th className="px-6 py-4 text-left">SUBMITTED</th>
                      <th className="px-6 py-4 text-left">STATUS</th>
                      <th className="px-6 py-4 text-left">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verifications.map((v) => {
                      const statusCfg = statusConfig[v.status] || { variant: "default", label: v.status.toUpperCase() };
                      const fssaiWarning = getFssaiExpiryWarning(v.fssai_expiry);
                      const fssaiDays = getFssaiDaysUntilExpiry(v.fssai_expiry);
                      return (
                        <tr key={v.id} className="border-t border-brand-black/20 hover:bg-brand-white/50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-display text-display-sm text-brand-black">{v.business_name}</p>
                              <p className="font-body text-body-xs text-brand-black/50 mt-1">
                                {v.contact_person_name} · {v.contact_email}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-body text-body-sm text-brand-black">
                              {businessTypes[v.business_type] || v.business_type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-body text-body-sm text-brand-black">{v.contact_phone}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <p className="font-mono text-xs text-brand-black">{v.fssai_number}</p>
                              <p className={`font-mono text-xs ${fssaiWarning ? "text-brand-red" : "text-brand-black/50"}`}>
                                Expires: {format(new Date(v.fssai_expiry), "MMM d, yyyy")}
                                {fssaiWarning && <span className="ml-2 text-brand-red">⚠ {fssaiDays} days</span>}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-body text-body-sm text-brand-black">
                              {v.city}, {v.state}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-body text-body-sm text-brand-black">
                              {v.avg_daily_surplus ? surplusLabels[v.avg_daily_surplus] || v.avg_daily_surplus : "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-mono text-xs text-brand-black/60">
                              {format(new Date(v.submitted_at), "MMM d, yyyy h:mm a")}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={statusCfg.variant} size="md">
                              {statusCfg.label}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              variant={v.status === "pending_review" || v.status === "under_review" ? "primary" : "ghost"}
                              size="sm"
                              onClick={() => window.location.href = `/admin/verification/${v.id}`}
                            >
                              {v.status === "pending_review" ? "REVIEW" : v.status === "under_review" ? "CONTINUE" : "VIEW"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t-2 border-brand-black/20">
                  <p className="font-body text-body-sm text-brand-black/60">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                    >
                      PREV
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                    >
                      NEXT
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
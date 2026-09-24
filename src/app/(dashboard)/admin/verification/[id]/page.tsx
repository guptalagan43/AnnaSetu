"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { format } from "date-fns";

interface VerificationDetail {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  contact_person_name: string;
  contact_email: string;
  contact_phone: string;
  why_donate: string | null;
  fssai_number: string;
  fssai_expiry: string;
  fssai_doc_url: string | null;
  gst_number: string | null;
  gst_doc_url: string | null;
  pan_number: string;
  pan_doc_url: string | null;
  address: string;
  city: string;
  state: string;
  pincode: string;
  pickup_location: string;
  operating_hours_start: string;
  operating_hours_end: string;
  operating_days: string[];
  avg_daily_surplus: string | null;
  food_types: string[];
  pickup_notes: string | null;
  status: string;
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  rejection_reason: string | null;
  reviewer: {
    display_name: string;
    email: string;
  } | null;
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

const operatingDaysLabels: Record<string, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const surplusLabels: Record<string, string> = {
  "<5kg": "< 5 kg",
  "5-20kg": "5–20 kg",
  "20-50kg": "20–50 kg",
  "50kg+": "50 kg+",
};

const foodTypeLabels: Record<string, string> = {
  cooked_meat_fish: "Cooked Meat / Fish",
  dairy_dish: "Dairy-based Dishes",
  cooked_rice_curry: "Cooked Rice / Curry",
  cooked_pasta: "Cooked Pasta / Noodles",
  soup_broth: "Soups / Broths",
  baked_bread: "Baked Goods / Bread",
  fresh_produce: "Fresh Produce",
  packaged_sealed: "Packaged / Sealed Items",
  beverage_opened: "Beverages (Opened)",
};

const checklistItems = [
  {
    id: "fssai_format",
    label: "FSSAI License — valid number format (14 digits)",
    description: "Check that the FSSAI license number is exactly 14 digits",
  },
  {
    id: "fssai_expiry",
    label: "FSSAI License — not expired (check expiry date)",
    description: "Verify the license is currently valid and not expired",
  },
  {
    id: "fssai_match",
    label: "FSSAI License — document matches the business name",
    description: "Cross-reference uploaded document with business name",
  },
  {
    id: "fssai_registry",
    label: "FSSAI — optionally cross-checked via FoSCoS public registry",
    description: "If possible, verify against the official FSSAI registry",
  },
  {
    id: "gst_format",
    label: "GST Number — valid format (15-character alphanumeric)",
    description: "Verify GSTIN format if provided",
  },
  {
    id: "gst_match",
    label: "GST Certificate — business name matches registration",
    description: "Verify uploaded GST certificate matches business name",
  },
  {
    id: "gst_status",
    label: "GST Status — active (not cancelled or suspended)",
    description: "Check GST portal for active status if provided",
  },
  {
    id: "pan_format",
    label: "PAN Number — valid format",
    description: "Verify PAN card number format (10 characters: 5 letters, 4 digits, 1 letter)",
  },
  {
    id: "phone_verification",
    label: "Phone Verification — admin called [phone number] on [date/time]",
    description: "Record the date and time of the verification call",
  },
  {
    id: "location_verification",
    label: "Location Verification — address mapped, pin confirmed on map",
    description: "Verify the address exists and matches the map pin location",
  },
  {
    id: "no_duplicate",
    label: "No duplicate account detected (same phone / FSSAI number)",
    description: "Check existing verified donors for duplicates",
  },
  {
    id: "no_adverse",
    label: "No adverse findings in initial review",
    description: "No red flags found during review",
  },
];

export default function AdminVerificationReviewPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [verification, setVerification] = useState<VerificationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [phoneCallNotes, setPhoneCallNotes] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchVerification = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/verification/${id}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to fetch verification");
      }

      setVerification(json.data);
      // Initialize checklist from any existing review notes
      if (json.data.review_notes) {
        try {
          const parsed = JSON.parse(json.data.review_notes);
          if (parsed.checklist) {
            setChecklist(parsed.checklist);
          }
          if (parsed.phoneCallNotes) {
            setPhoneCallNotes(parsed.phoneCallNotes);
          }
        } catch {
          // Ignore parse errors
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      console.error("[Admin Verification Review] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVerification();
  }, [fetchVerification]);

  const handleChecklistChange = (itemId: string, checked: boolean) => {
    setChecklist((prev) => ({ ...prev, [itemId]: checked }));
  };

  const allChecklistComplete = checklistItems.every((item) => checklist[item.id]);

  const saveReviewNotes = () => {
    const notesData = {
      checklist,
      phoneCallNotes,
      reviewNotes,
    };
    // For now just save locally - in real implementation this would be saved to DB
    console.log("Saving review notes:", notesData);
  };

  const handleApprove = async () => {
    if (!allChecklistComplete) {
      alert("Please complete all checklist items before approving");
      return;
    }
    setActionLoading("approve");
    try {
      const notesData = {
        checklist,
        phoneCallNotes,
        reviewNotes,
      };
      const res = await fetch(`/api/verification/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_notes: JSON.stringify(notesData) }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to approve");
      }
      alert("Verification approved successfully!");
      router.push("/admin/verification");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      alert(`Failed to approve: ${message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim() || rejectionReason.trim().length < 10) {
      alert("Please provide a rejection reason of at least 10 characters");
      return;
    }
    setActionLoading("reject");
    try {
      const res = await fetch(`/api/verification/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rejection_reason: rejectionReason.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to reject");
      }
      alert("Verification rejected");
      router.push("/admin/verification");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      alert(`Failed to reject: ${message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkUnderReview = async () => {
    setActionLoading("under_review");
    try {
      const res = await fetch(`/api/verification/${id}`, {
        method: "PATCH",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update status");
      }
      setVerification((prev) => (prev ? { ...prev, status: "under_review" } : null));
      alert("Status updated to Under Review");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      alert(`Failed to update: ${message}`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <header>
          <h1 className="font-display text-display-lg text-brand-black">VERIFICATION REVIEW</h1>
        </header>
        <Card variant="default">
          <CardContent className="py-12 text-center">
            <div className="font-body text-body-lg text-brand-black/50">Loading verification…</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !verification) {
    return (
      <div className="space-y-8">
        <header>
          <h1 className="font-display text-display-lg text-brand-black">VERIFICATION REVIEW</h1>
        </header>
        <Card variant="default">
          <CardContent className="p-6 text-center">
            <p className="font-body text-body-md text-brand-red">Error: {error || "Verification not found"}</p>
            <Button variant="secondary" size="sm" onClick={() => router.push("/admin/verification")} className="mt-4">
              BACK TO QUEUE
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusCfg = statusConfig[verification.status] || { variant: "default", label: verification.status.toUpperCase() };
  const fssaiExpiryDate = new Date(verification.fssai_expiry);
  const daysUntilExpiry = Math.floor((fssaiExpiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const fssaiWarning = daysUntilExpiry < 90;

  const extractCoords = (pointStr: string) => {
    const match = pointStr.match(/POINT\(([^)]+)\)/);
    if (match) {
      const [lng, lat] = match[1].split(" ").map(Number);
      return { lat, lng };
    }
    return null;
  };

  const coords = extractCoords(verification.pickup_location);

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="font-display text-display-lg text-brand-black">VERIFICATION REVIEW</h1>
          <p className="font-body text-body-md text-brand-black/60 mt-1">
            {verification.business_name} · {businessTypes[verification.business_type] || verification.business_type}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant={statusCfg.variant} size="lg">
            {statusCfg.label}
          </Badge>
          {verification.status === "pending_review" && (
            <Button variant="secondary" size="sm" onClick={handleMarkUnderReview} disabled={actionLoading === "under_review"}>
              MARK UNDER REVIEW
            </Button>
          )}
        </div>
      </header>

      {/* FSSAI Expiry Warning Banner */}
      {fssaiWarning && (
        <Card variant="default" className="border-brand-red bg-brand-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-display text-xl text-brand-red">⚠</span>
              <div>
                <p className="font-body font-bold text-brand-black">FSSAI LICENSE EXPIRY WARNING</p>
                <p className="font-body text-body-sm text-brand-black/70">
                  License expires in {daysUntilExpiry} days ({format(fssaiExpiryDate, "MMMM d, yyyy")})
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Left 2/3 */}
        <div className="lg:col-span-2 space-y-8">
          {/* Business Info */}
          <Card variant="default">
            <CardHeader>
              <h2 className="font-display text-display-md text-brand-black">BUSINESS INFORMATION</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label-text text-brand-black/60">BUSINESS NAME</label>
                  <p className="font-display text-display-sm text-brand-black mt-1">{verification.business_name}</p>
                </div>
                <div>
                  <label className="label-text text-brand-black/60">BUSINESS TYPE</label>
                  <p className="font-body text-body-md text-brand-black mt-1">
                    {businessTypes[verification.business_type] || verification.business_type}
                  </p>
                </div>
                <div>
                  <label className="label-text text-brand-black/60">CONTACT PERSON</label>
                  <p className="font-body text-body-md text-brand-black mt-1">{verification.contact_person_name}</p>
                </div>
                <div>
                  <label className="label-text text-brand-black/60">CONTACT EMAIL</label>
                  <p className="font-body text-body-md text-brand-black mt-1">{verification.contact_email}</p>
                </div>
                <div>
                  <label className="label-text text-brand-black/60">CONTACT PHONE</label>
                  <p className="font-body text-body-md text-brand-black mt-1">{verification.contact_phone}</p>
                </div>
                <div>
                  <label className="label-text text-brand-black/60">WHY DONATE?</label>
                  <p className="font-body text-body-sm text-brand-black/70 mt-1">
                    {verification.why_donate || "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card variant="default">
            <CardHeader>
              <h2 className="font-display text-display-md text-brand-black">DOCUMENTS</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border-2 border-brand-black bg-brand-white/50">
                  <label className="label-text text-brand-black/60">FSSAI LICENSE</label>
                  <p className="font-mono text-xs text-brand-black mt-1">{verification.fssai_number}</p>
                  <p className="font-mono text-xs text-brand-black/50 mt-1">
                    Expires: {format(new Date(verification.fssai_expiry), "MMM d, yyyy")}
                  </p>
                  {verification.fssai_doc_url && (
                    <a
                      href={verification.fssai_doc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block font-body text-body-sm text-brand-red hover:underline"
                    >
                      VIEW DOCUMENT →
                    </a>
                  )}
                </div>
                <div className="p-4 border-2 border-brand-black bg-brand-white/50">
                  <label className="label-text text-brand-black/60">GST CERTIFICATE</label>
                  <p className="font-mono text-xs text-brand-black mt-1">{verification.gst_number || "Not provided"}</p>
                  {verification.gst_doc_url && (
                    <a
                      href={verification.gst_doc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block font-body text-body-sm text-brand-red hover:underline"
                    >
                      VIEW DOCUMENT →
                    </a>
                  )}
                </div>
                <div className="p-4 border-2 border-brand-black bg-brand-white/50">
                  <label className="label-text text-brand-black/60">PAN CARD</label>
                  <p className="font-mono text-xs text-brand-black mt-1">{verification.pan_number}</p>
                  {verification.pan_doc_url && (
                    <a
                      href={verification.pan_doc_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block font-body text-body-sm text-brand-red hover:underline"
                    >
                      VIEW DOCUMENT →
                    </a>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card variant="default">
            <CardHeader>
              <h2 className="font-display text-display-md text-brand-black">LOCATION</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="label-text text-brand-black/60">ADDRESS</label>
                  <p className="font-body text-body-md text-brand-black mt-1">{verification.address}</p>
                </div>
                <div>
                  <label className="label-text text-brand-black/60">CITY / STATE / PIN</label>
                  <p className="font-body text-body-md text-brand-black mt-1">
                    {verification.city}, {verification.state} {verification.pincode}
                  </p>
                </div>
              </div>
              {coords && (
                <div className="aspect-video border-2 border-brand-black bg-brand-black/5 relative overflow-hidden">
                  <iframe
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${coords.lng - 0.01}%2C${coords.lat - 0.01}%2C${coords.lng + 0.01}%2C${coords.lat + 0.01}&layer=mapnik&marker=${coords.lat}%2C${coords.lng}`}
                    className="absolute inset-0 w-full h-full border-0"
                    style={{ border: 0 }}
                    allowFullScreen
                    title="Business location map"
                  />
                </div>
              )}
              {verification.pickup_notes && (
                <div>
                  <label className="label-text text-brand-black/60">PICKUP NOTES</label>
                  <p className="font-body text-body-sm text-brand-black/70 mt-1">{verification.pickup_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Operating Hours */}
          <Card variant="default">
            <CardHeader>
              <h2 className="font-display text-display-md text-brand-black">OPERATIONS</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="label-text text-brand-black/60">OPERATING HOURS</label>
                  <p className="font-body text-body-md text-brand-black mt-1">
                    {verification.operating_hours_start} – {verification.operating_hours_end}
                  </p>
                </div>
                <div>
                  <label className="label-text text-brand-black/60">OPERATING DAYS</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {verification.operating_days.map((day) => (
                      <Badge key={day} variant="default" size="sm">
                        {operatingDaysLabels[day] || day.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label-text text-brand-black/60">AVG DAILY SURPLUS</label>
                  <p className="font-body text-body-md text-brand-black mt-1">
                    {verification.avg_daily_surplus ? surplusLabels[verification.avg_daily_surplus] || verification.avg_daily_surplus : "—"}
                  </p>
                </div>
              </div>
              <div>
                <label className="label-text text-brand-black/60">FOOD TYPES HANDLED</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {verification.food_types.map((type) => (
                    <Badge key={type} variant="caution" size="sm">
                      {foodTypeLabels[type] || type}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Admin Checklist */}
          <Card variant="default">
            <CardHeader>
              <h2 className="font-display text-display-md text-brand-black">ADMIN VERIFICATION CHECKLIST</h2>
              <p className="font-body text-body-sm text-brand-black/60 mt-1">
                Complete all items before approving or rejecting
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {checklistItems.map((item) => (
                <div key={item.id} className="flex items-start gap-4 p-4 border-2 border-brand-black bg-brand-white/50">
                  <input
                    type="checkbox"
                    id={item.id}
                    checked={checklist[item.id] || false}
                    onChange={(e) => handleChecklistChange(item.id, e.target.checked)}
                    className="mt-1 w-5 h-5 accent-brand-red border-2 border-brand-black"
                    aria-describedby={`${item.id}-desc`}
                  />
                  <div className="flex-1">
                    <label htmlFor={item.id} className="font-body font-medium text-body-sm text-brand-black cursor-pointer">
                      {item.label}
                    </label>
                    <p id={`${item.id}-desc`} className="font-body text-body-xs text-brand-black/50 mt-1">
                      {item.description}
                    </p>
                    {item.id === "phone_verification" && (
                      <div className="mt-3">
                        <Input
                          label="PHONE CALL NOTES (date/time/notes)"
                          placeholder="Called on Jan 15 at 2:30 PM — spoke with owner Ravi..."
                          value={phoneCallNotes}
                          onChange={(e) => setPhoneCallNotes(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <div className="flex items-center gap-4 w-full justify-between">
                <span className="font-body text-body-sm text-brand-black/60">
                  {Object.values(checklist).filter(Boolean).length} / {checklistItems.length} completed
                </span>
<Button
                    variant="ghost"
                    size="sm"
                    onClick={saveReviewNotes}
                    disabled={!!actionLoading}
                  >
                    SAVE NOTES
                  </Button>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Sidebar - Actions */}
        <div className="lg:col-span-1">
          <Card variant="elevated" className="sticky top-24">
            <CardHeader>
              <h2 className="font-display text-display-md text-brand-black">ACTIONS</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {verification.status === "pending_review" || verification.status === "under_review" ? (
                <>
                  <div className="space-y-3">
                    <h3 className="label-text text-brand-black/60">APPROVE</h3>
                    <p className="font-body text-body-xs text-brand-black/50">
                      Mark as verified donor. Account will be activated immediately.
                    </p>
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                      onClick={handleApprove}
                      disabled={actionLoading === "approve" || !allChecklistComplete}
                    >
                      {actionLoading === "approve" ? "APPROVING…" : "APPROVE DONOR"}
                    </Button>
                    {!allChecklistComplete && (
                      <p className="font-body text-body-xs text-brand-red text-center">
                        Complete all checklist items to enable
                      </p>
                    )}
                  </div>

                  <div className="border-t-2 border-brand-black/20 pt-4 space-y-3">
                    <h3 className="label-text text-brand-black/60">REJECT</h3>
                    <p className="font-body text-body-xs text-brand-black/50">
                      Reject application. Donor will be notified with reason.
                    </p>
                    <label className="block label-text text-brand-black mb-2">
                        REJECTION REASON (min 10 chars)
                      </label>
                      <textarea
                        placeholder="Enter reason for rejection..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                        className="w-full bg-brand-white text-brand-black border-2 border-brand-black px-4 py-3 text-body-md font-body placeholder:text-gray-400 focus:outline-none focus:border-brand-red focus:shadow-[2px_2px_0px_0px_#D42B2B] transition-shadow"
                      />
                    <Button
                      variant="destructive"
                      size="lg"
                      className="w-full"
                      onClick={handleReject}
                      disabled={actionLoading === "reject" || !rejectionReason.trim() || rejectionReason.trim().length < 10}
                    >
                      {actionLoading === "reject" ? "REJECTING…" : "REJECT APPLICATION"}
                    </Button>
                  </div>
                </>
              ) : verification.status === "approved" ? (
                <div className="space-y-3 text-center">
                  <Badge variant="safe" size="lg" className="w-full">
                    APPROVED
                  </Badge>
                  <p className="font-body text-body-sm text-brand-black/60">
                    This donor has been approved and can now list food.
                  </p>
                  {verification.reviewed_at && (
                    <p className="font-mono text-xs text-brand-black/50">
                      Approved on {format(new Date(verification.reviewed_at), "MMM d, yyyy h:mm a")}
                      {verification.reviewer && ` by ${verification.reviewer.display_name}`}
                    </p>
                  )}
                  {verification.review_notes && (
                    <div className="mt-4 p-3 border-2 border-brand-black bg-brand-white/50 text-left">
                      <label className="label-text text-brand-black/60">REVIEW NOTES</label>
                      <pre className="font-mono text-xs text-brand-black/70 mt-1 whitespace-pre-wrap">
                        {verification.review_notes}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 text-center">
                  <Badge variant="emergency" size="lg" className="w-full">
                    REJECTED
                  </Badge>
                  <p className="font-body text-body-sm text-brand-black/60">
                    This application was rejected.
                  </p>
                  {verification.reviewed_at && (
                    <p className="font-mono text-xs text-brand-black/50">
                      Rejected on {format(new Date(verification.reviewed_at), "MMM d, yyyy h:mm a")}
                      {verification.reviewer && ` by ${verification.reviewer.display_name}`}
                    </p>
                  )}
                  {verification.rejection_reason && (
                    <div className="mt-4 p-3 border-2 border-brand-red bg-brand-white/50 text-left">
                      <label className="label-text text-brand-red">REJECTION REASON</label>
                      <p className="font-body text-body-sm text-brand-black mt-1">{verification.rejection_reason}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t-2 border-brand-black/20 pt-4">
                <Button
                  variant="ghost"
                  size="md"
                  className="w-full"
                  onClick={() => router.push("/admin/verification")}
                >
                  BACK TO QUEUE
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Submission Info */}
          <Card variant="default" className="mt-4">
            <CardHeader>
              <h2 className="font-display text-display-sm text-brand-black">SUBMISSION INFO</h2>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-body-sm">
                <span className="text-brand-black/60">Submitted</span>
                <span className="font-mono text-brand-black">{format(new Date(verification.submitted_at), "MMM d, yyyy h:mm a")}</span>
              </div>
              {verification.reviewed_at && (
                <div className="flex justify-between text-body-sm">
                  <span className="text-brand-black/60">Reviewed</span>
                  <span className="font-mono text-brand-black">{format(new Date(verification.reviewed_at), "MMM d, yyyy h:mm a")}</span>
                </div>
              )}
              {verification.reviewer && (
                <div className="flex justify-between text-body-sm">
                  <span className="text-brand-black/60">Reviewed by</span>
                  <span className="font-body text-brand-black">{verification.reviewer.display_name}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z, ZodError } from "zod";
import { queueEmail } from "@/lib/queue/emailQueue";
import { renderVerificationRejected } from "@/lib/email/templates";

const rejectBodySchema = z.object({
  rejection_reason: z.string().min(10, "Please provide a reason of at least 10 characters"),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/verification/[id]/reject
export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Check auth
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role, display_name")
      .eq("id", session.user.id)
      .single();

    const adminRoles = ["super_admin", "platform_admin", "moderator"];
    if (!adminProfile || !adminRoles.includes(adminProfile.role)) {
      return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
    }

    // Parse + validate rejection reason (required for reject)
    const body: unknown = await request.json();
    const { rejection_reason } = rejectBodySchema.parse(body);

    // Fetch the verification
    const { data: verification, error: fetchError } = await supabase
      .from("donor_verifications")
      .select("id, status, user_id, business_name, contact_email, contact_person_name")
      .eq("id", id)
      .single();

    if (fetchError || !verification) {
      return NextResponse.json({ error: "Verification not found" }, { status: 404 });
    }

    if (!["pending_review", "under_review"].includes(verification.status)) {
      return NextResponse.json(
        {
          error: `Cannot reject a verification with status '${verification.status}'`,
          code: "INVALID_STATE",
        },
        { status: 409 }
      );
    }

    // Update verification status
    const { error: updateError } = await supabase
      .from("donor_verifications")
      .update({
        status: "rejected",
        reviewed_by: session.user.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason,
      })
      .eq("id", id);

    if (updateError) {
      console.error("[Reject] DB update error:", { id, error: updateError });
      return NextResponse.json({ error: "Failed to reject — please try again" }, { status: 500 });
    }

    console.info("[Reject] Verification rejected:", {
      id,
      business: verification.business_name,
      rejected_by: adminProfile.display_name,
      reason: rejection_reason,
    });

    // Queue VerificationRejected email (Phase 06) — high priority, never throws
    (async () => {
      const html = await renderVerificationRejected({
        donorName: verification.contact_person_name ?? "Donor",
        businessName: verification.business_name,
        rejectionReason: rejection_reason,
        reviewedAt: new Date().toISOString(),
      });

      await queueEmail({
        to: verification.contact_email,
        subject: "Update on your AnnaSetu donor verification application",
        html,
        priority: "high",
        metadata: { userId: verification.user_id, eventType: "verification_rejected" },
      });
    })().catch((err) => {
      console.error("[Reject] Email queue error (non-fatal):", err);
    });

    return NextResponse.json({
      data: {
        id,
        status: "rejected",
        message: `${verification.business_name}'s application has been rejected.`,
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message, field: "rejection_reason", code: "VALIDATION_ERROR" },
        { status: 422 }
      );
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Reject] Unexpected:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

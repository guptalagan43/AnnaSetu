import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { queueEmail } from "@/lib/queue/emailQueue";
import { renderVerificationApproved, renderWelcomeDonor } from "@/lib/email/templates";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/verification/[id]/approve
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

    // Optional: parse checklist notes from body
    let reviewNotes: string | null = null;
    try {
      const body = await request.json() as { review_notes?: string };
      reviewNotes = body.review_notes || null;
    } catch {
      // body is optional
    }

    // Fetch the verification to make sure it exists and is in an approvable state
    const { data: verification, error: fetchError } = await supabase
      .from("donor_verifications")
      .select("id, status, user_id, business_name, business_type, contact_email, contact_person_name, fssai_number")
      .eq("id", id)
      .single();

    if (fetchError || !verification) {
      return NextResponse.json({ error: "Verification not found" }, { status: 404 });
    }

    if (!["pending_review", "under_review"].includes(verification.status)) {
      return NextResponse.json(
        {
          error: `Cannot approve a verification with status '${verification.status}'`,
          code: "INVALID_STATE",
        },
        { status: 409 }
      );
    }

    // Update verification status
    const { error: updateError } = await supabase
      .from("donor_verifications")
      .update({
        status: "approved",
        reviewed_by: session.user.id,
        reviewed_at: new Date().toISOString(),
        review_notes: reviewNotes,
      })
      .eq("id", id);

    if (updateError) {
      console.error("[Approve] DB update error:", { id, error: updateError });
      return NextResponse.json({ error: "Failed to approve — please try again" }, { status: 500 });
    }

    // Update user profile role to verified donor (mark as verified)
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ is_verified_donor: true })
      .eq("id", verification.user_id);

    if (profileError) {
      // Non-fatal — log but don't fail the response
      console.error("[Approve] Profile update error:", { user_id: verification.user_id, error: profileError });
    }

    console.info("[Approve] Verification approved:", {
      id,
      business: verification.business_name,
      approved_by: adminProfile.display_name,
    });

    // Queue VerificationApproved + WelcomeDonor emails (Phase 06)
    // Runs after DB commit; never throws — email failure must not fail the response
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://annasetu.vercel.app";
    (async () => {
      const [approvedHtml, welcomeHtml] = await Promise.all([
        renderVerificationApproved({
          donorName: verification.contact_person_name ?? "Donor",
          businessName: verification.business_name,
          businessType: verification.business_type ?? "",
          fssaiNumber: verification.fssai_number ?? "",
          reviewedAt: new Date().toISOString(),
          reviewedBy: adminProfile.display_name ?? "AnnaSetu Admin",
          loginUrl: `${appUrl}/login`,
        }),
        renderWelcomeDonor({
          donorName: verification.contact_person_name ?? "Donor",
          businessName: verification.business_name,
          dashboardUrl: `${appUrl}/donor`,
        }),
      ]);

      await Promise.all([
        queueEmail({
          to: verification.contact_email,
          subject: "✅ Your AnnaSetu verification has been approved",
          html: approvedHtml,
          priority: "high",
          metadata: { userId: verification.user_id, eventType: "verification_approved" },
        }),
        queueEmail({
          to: verification.contact_email,
          subject: "Welcome to AnnaSetu — here's how to get started",
          html: welcomeHtml,
          priority: "normal",
          metadata: { userId: verification.user_id, eventType: "welcome_donor" },
        }),
      ]);
    })().catch((err) => {
      console.error("[Approve] Email queue error (non-fatal):", err);
    });

    return NextResponse.json({
      data: {
        id,
        status: "approved",
        message: `${verification.business_name} has been approved as a verified donor.`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Approve] Unexpected:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

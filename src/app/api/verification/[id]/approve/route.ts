import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
      .select("id, status, user_id, business_name, contact_email")
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

    // ponytail: email queuing deferred to Phase 06 (email system)
    // TODO: queue VerificationApproved email to verification.contact_email

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

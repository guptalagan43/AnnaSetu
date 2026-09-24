import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/verification/[id] — get a single verification (admin only)
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
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
      .select("role")
      .eq("id", session.user.id)
      .single();

    const adminRoles = ["super_admin", "platform_admin", "moderator"];
    if (!adminProfile || !adminRoles.includes(adminProfile.role)) {
      return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
    }

    const { data: verification, error } = await supabase
      .from("donor_verifications")
      .select(
        `
        *,
        reviewer:profiles!donor_verifications_reviewed_by_fkey(display_name, email)
      `
      )
      .eq("id", id)
      .single();

    if (error || !verification) {
      return NextResponse.json({ error: "Verification not found" }, { status: 404 });
    }

    // Check FSSAI expiry warning (< 90 days from now)
    const expiryDate = new Date(verification.fssai_expiry);
    const daysUntilExpiry = Math.floor(
      (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    const fssaiExpiryWarning = daysUntilExpiry < 90;

    return NextResponse.json({
      data: {
        ...verification,
        fssai_expiry_warning: fssaiExpiryWarning,
        fssai_days_until_expiry: daysUntilExpiry,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Verification GET/:id] Unexpected:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PATCH /api/verification/[id] — update status to 'under_review' (admin marks as in review)
export async function PATCH(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
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
      .select("role")
      .eq("id", session.user.id)
      .single();

    const adminRoles = ["super_admin", "platform_admin", "moderator"];
    if (!adminProfile || !adminRoles.includes(adminProfile.role)) {
      return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
    }

    const { data: verification } = await supabase
      .from("donor_verifications")
      .select("id, status")
      .eq("id", id)
      .single();

    if (!verification) {
      return NextResponse.json({ error: "Verification not found" }, { status: 404 });
    }

    if (verification.status !== "pending_review") {
      return NextResponse.json(
        { error: "Only pending_review applications can be moved to under_review", code: "INVALID_STATE" },
        { status: 409 }
      );
    }

    const { error: updateError } = await supabase
      .from("donor_verifications")
      .update({
        status: "under_review",
        reviewed_by: session.user.id,
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }

    return NextResponse.json({ data: { id, status: "under_review" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Verification PATCH/:id] Unexpected:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

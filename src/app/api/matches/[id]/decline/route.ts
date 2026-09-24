import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rematchListing } from "@/lib/matching/engine";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const adminSupabase = createAdminClient();

    // Verify user role
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    const role = profile?.role ?? "";
    const isAdmin = ["super_admin", "platform_admin", "moderator"].includes(role);
    const isShelter = ["shelter_admin", "shelter_coordinator"].includes(role);

    if (!isAdmin && !isShelter) {
      return NextResponse.json(
        { error: "Forbidden: Only shelter staff or admins can decline matches" },
        { status: 403 }
      );
    }

    // Parse and validate required reason (Phase 10: requires reason)
    let reason = "";
    try {
      const body = await request.json();
      if (body && typeof body.reason === "string") {
        reason = body.reason.trim();
      }
    } catch {
      // Body parse failure
    }

    if (!reason) {
      return NextResponse.json(
        { error: "Decline reason is required" },
        { status: 400 }
      );
    }

    // 1. Fetch current match
    const { data: match, error: matchError } = await adminSupabase
      .from("matches")
      .select("id, listing_id, shelter_id, status")
      .eq("id", id)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // 2. Mark this match as declined
    const { error: updateError } = await adminSupabase
      .from("matches")
      .update({
        status: "declined",
        shelter_response_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 3. Trigger re-matching for the listing (SRS §9.3 & §9.4 / FR-MATCH-05)
    const rematchResult = await rematchListing(match.listing_id);

    return NextResponse.json({
      success: true,
      message: "Match declined. Re-matching cascade initiated.",
      reason,
      nextMatch: rematchResult.match,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

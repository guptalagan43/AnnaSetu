import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
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

    const adminSupabase = createAdminClient();

    // 1. Fetch assignment
    const { data: assignment, error: assignError } = await adminSupabase
      .from("driver_assignments")
      .select("id, listing_id, driver_id, status")
      .eq("id", id)
      .single();

    if (assignError || !assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const nowIso = new Date().toISOString();

    // 2. Update assignment status to 'delivered'
    const { error: updateAssignError } = await adminSupabase
      .from("driver_assignments")
      .update({
        status: "delivered",
        delivered_at: nowIso,
      })
      .eq("id", id);

    if (updateAssignError) {
      return NextResponse.json({ error: updateAssignError.message }, { status: 500 });
    }

    // 3. Advance listing status: in_transit -> checklist (per Phase 11 pipeline)
    if (assignment.listing_id) {
      await adminSupabase
        .from("listings")
        .update({
          status: "checklist",
          updated_at: nowIso,
        })
        .eq("id", assignment.listing_id);
    }

    return NextResponse.json({
      success: true,
      message: "Delivery arrived at shelter. Status advanced to checklist.",
      assignmentId: id,
      listingId: assignment.listing_id,
      status: "delivered",
      listingStatus: "checklist",
      delivered_at: nowIso,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

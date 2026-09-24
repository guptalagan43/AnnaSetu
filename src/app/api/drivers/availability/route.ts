import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const adminSupabase = createAdminClient();

    let targetAvailable: boolean | undefined;
    try {
      const body = await request.json();
      if (typeof body.is_available === "boolean") {
        targetAvailable = body.is_available;
      }
    } catch {
      // Toggle if not explicitly specified
    }

    // Find driver record
    const { data: driver, error: findError } = await adminSupabase
      .from("drivers")
      .select("id, is_available")
      .eq("profile_id", userId)
      .maybeSingle();

    if (findError) {
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }

    if (!driver) {
      // Auto-provision if missing
      const { data: newDriver } = await adminSupabase
        .from("drivers")
        .insert({
          profile_id: userId,
          vehicle_type: "bike",
          is_available: true,
        })
        .select()
        .single();

      return NextResponse.json({
        success: true,
        is_available: newDriver?.is_available ?? true,
        message: "Driver status updated",
      });
    }

    const newStatus = targetAvailable !== undefined ? targetAvailable : !driver.is_available;

    const { data: updated, error: updateError } = await adminSupabase
      .from("drivers")
      .update({ is_available: newStatus })
      .eq("id", driver.id)
      .select("id, is_available")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      is_available: updated.is_available,
      message: updated.is_available
        ? "You are now ONLINE and available for rescue pickups."
        : "You are now OFFLINE. No new assignments will be dispatched.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

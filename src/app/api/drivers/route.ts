import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest): Promise<NextResponse> {
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
    const { searchParams } = new URL(request.url);
    const isAvailableParam = searchParams.get("is_available");
    const selfOnly = searchParams.get("self") === "true";

    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    const role = profile?.role ?? "";
    const isAdmin = ["super_admin", "platform_admin", "moderator"].includes(role);

    if (selfOnly || (!isAdmin && role.includes("driver"))) {
      // Return current driver's profile
      const { data: driver, error } = await adminSupabase
        .from("drivers")
        .select(`
          *,
          profiles!drivers_profile_id_fkey(
            id,
            full_name,
            phone,
            email,
            role
          )
        `)
        .eq("profile_id", userId)
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ data: driver });
    }

    // Admin query for all drivers or available drivers
    let query = adminSupabase
      .from("drivers")
      .select(`
        id,
        profile_id,
        vehicle_type,
        is_available,
        reliability_score,
        created_at,
        profiles!drivers_profile_id_fkey(
          id,
          full_name,
          phone,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (isAvailableParam !== null) {
      query = query.eq("is_available", isAvailableParam === "true");
    }

    const { data: drivers, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: drivers || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
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
    const body = await request.json();

    const {
      vehicle_type = "bike",
      phone,
      latitude = 12.9716,
      longitude = 77.5946,
    } = body;

    // 1. Ensure profile has driver role and phone updated
    await adminSupabase
      .from("profiles")
      .update({
        role: "volunteer_driver",
        phone: phone || undefined,
      })
      .eq("id", userId);

    // 2. Check if driver record already exists
    const { data: existingDriver } = await adminSupabase
      .from("drivers")
      .select("id")
      .eq("profile_id", userId)
      .maybeSingle();

    let driverRecord;

    if (existingDriver) {
      const { data, error } = await adminSupabase
        .from("drivers")
        .update({
          vehicle_type,
          location: `SRID=4326;POINT(${longitude} ${latitude})`,
          is_available: true,
        })
        .eq("id", existingDriver.id)
        .select()
        .single();

      if (error) throw error;
      driverRecord = data;
    } else {
      const { data, error } = await adminSupabase
        .from("drivers")
        .insert({
          profile_id: userId,
          vehicle_type,
          location: `SRID=4326;POINT(${longitude} ${latitude})`,
          is_available: true,
          reliability_score: 0.95,
        })
        .select()
        .single();

      if (error) throw error;
      driverRecord = data;
    }

    return NextResponse.json({
      success: true,
      message: "Driver profile registered and activated.",
      data: driverRecord,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

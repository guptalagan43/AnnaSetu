import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/matches — role-filtered match listing
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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const listingId = searchParams.get("listing_id");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10), 0);

    // Fetch user profile role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    const role = profile?.role ?? "";
    const isAdmin = ["super_admin", "platform_admin", "moderator"].includes(role);
    const isShelter = ["shelter_admin", "shelter_coordinator"].includes(role);
    const isDonor = ["donor_admin", "donor_staff"].includes(role);

    let query = supabase
      .from("matches")
      .select(`
        *,
        listings!matches_listing_id_fkey(
          id,
          title,
          food_category,
          quantity_kg,
          estimated_servings,
          pickup_address,
          pickup_window_start,
          pickup_window_end,
          expiry_time,
          ers_score,
          status,
          donor_id
        ),
        shelters!matches_shelter_id_fkey(
          id,
          name,
          address,
          capacity_kg,
          current_load_kg,
          food_preferences,
          food_restrictions,
          reliability_score,
          status
        )
      `, { count: "exact" });

    // Role filtering per Phase 09 task
    if (isShelter) {
      // Find shelter associated with this profile
      const { data: shelter } = await supabase
        .from("shelters")
        .select("id")
        .eq("profile_id", userId)
        .maybeSingle();

      if (shelter) {
        query = query.eq("shelter_id", shelter.id);
      } else {
        // No shelter profile linked yet
        return NextResponse.json({ data: [], total: 0, limit, offset });
      }
    } else if (isDonor) {
      // Filter by donor's listings
      query = query.eq("listings.donor_id", userId);
    } else if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (status && status !== "ALL") {
      query = query.eq("status", status.toLowerCase());
    }

    if (listingId) {
      query = query.eq("listing_id", listingId);
    }

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("[Matches GET] Fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data: data ?? [],
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Matches GET] Unexpected error:", message);
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
  }
}

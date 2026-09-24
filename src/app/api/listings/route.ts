import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createListingSchema } from "@/lib/validators/listing.schema";

import { calculateERS } from "@/lib/ers/calculator";
import { cacheListingERS } from "@/lib/ers/cache";
import { getOutdoorTemperature } from "@/lib/ers/weather";

/**
 * Generates a random 4-digit Donor PIN for chain of custody verification.
 */
function generateDonorPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// GET /api/listings — list listings with filtering
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") ?? "0", 10), 0);
    const relistLatest = searchParams.get("latest") === "true";

    // Check user role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    const isAdmin = ["super_admin", "platform_admin", "moderator"].includes(profile?.role ?? "");

    // If requested the latest listing (for one-click relist prefill)
    if (relistLatest) {
      const { data: latest, error: latestError } = await supabase
        .from("listings")
        .select("*")
        .eq("donor_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestError) {
        return NextResponse.json({ error: latestError.message }, { status: 500 });
      }

      return NextResponse.json({ data: latest });
    }

    let query = supabase
      .from("listings")
      .select("*", { count: "exact" });

    // Non-admins can only see their own listings
    if (!isAdmin) {
      query = query.eq("donor_id", session.user.id);
    }

    if (status && status !== "ALL") {
      query = query.eq("status", status.toLowerCase());
    }

    query = query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("[Listings GET] Fetch error:", error);
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
    console.error("[Listings GET] Unexpected error:", message);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}

// POST /api/listings — create a new food listing
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized — please log in" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check donor verification status
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_verified_donor")
      .eq("id", userId)
      .single();

    const allowedRoles = ["donor_admin", "donor_staff", "super_admin", "platform_admin", "moderator"];
    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.json(
        { error: "Only donor accounts can post food listings", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    // Check if verified donor
    let isVerified = profile.is_verified_donor === true;
    let verificationId: string | null = null;

    const { data: verif } = await supabase
      .from("donor_verifications")
      .select("id, status")
      .eq("user_id", userId)
      .eq("status", "approved")
      .maybeSingle();

    if (verif) {
      isVerified = true;
      verificationId = verif.id;
    }

    if (!isVerified) {
      return NextResponse.json(
        {
          error: "Your business must be approved and verified before you can post food listings.",
          code: "NOT_VERIFIED",
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body: unknown = await request.json();
    const parsed = createListingSchema.parse(body);

    // Generate 4-digit Donor PIN
    const donorPin = generateDonorPin();

    // Calculate initial ERS score with optional weather adjustment
    const now = new Date();
    const outdoorTemp = await getOutdoorTemperature(parsed.latitude, parsed.longitude);
    const ersBreakdown = calculateERS({
      foodCategory: parsed.food_category,
      expiryTime: parsed.expiry_time,
      currentTime: now,
      status: "listed",
      outdoorTempCelsius: outdoorTemp,
    });
    const initialErs = ersBreakdown.score;

    // Format pickup address including optional notes
    const formattedAddress = parsed.notes
      ? `${parsed.pickup_address} [Notes: ${parsed.notes}]`
      : parsed.pickup_address;

    // PostGIS Point EWKT format
    const pickupLocation = `SRID=4326;POINT(${parsed.longitude} ${parsed.latitude})`;

    const { data: listing, error: insertError } = await supabase
      .from("listings")
      .insert({
        donor_id: userId,
        donor_verification_id: verificationId,
        title: parsed.title,
        food_category: parsed.food_category,
        quantity_kg: parsed.quantity_kg,
        estimated_servings: parsed.estimated_servings,
        packaging_type: parsed.packaging_type,
        allergens: parsed.allergens,
        pickup_address: formattedAddress,
        pickup_location: pickupLocation,
        pickup_window_start: parsed.pickup_window_start,
        pickup_window_end: parsed.pickup_window_end,
        expiry_time: parsed.expiry_time,
        donor_pin: donorPin,
        ers_score: initialErs,
        ers_updated_at: now.toISOString(),
        status: "listed",
        intake_method: parsed.intake_method,
        photo_url: parsed.photo_url || null,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("[Listings POST] Insert error:", insertError);
      return NextResponse.json({ error: "Failed to create listing: " + insertError.message }, { status: 500 });
    }

    // Cache initial ERS in Redis (15-min TTL)
    await cacheListingERS(listing.id, initialErs, 900);

    console.info("[Listings POST] Listing created successfully:", {
      id: listing.id,
      title: listing.title,
      donor_id: userId,
      ers: initialErs,
      pin: donorPin,
    });

    return NextResponse.json(
      {
        data: listing,
        message: "Food listing created successfully. Matching has begun.",
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      const first = error.errors[0];
      return NextResponse.json(
        {
          error: first.message,
          field: first.path.join("."),
          code: "VALIDATION_ERROR",
        },
        { status: 422 }
      );
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Listings POST] Unexpected error:", message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

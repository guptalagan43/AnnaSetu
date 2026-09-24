import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { queueEmail } from "@/lib/queue/emailQueue";
import { renderMatchAccepted } from "@/lib/email/templates";

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
      .select("role, full_name, email")
      .eq("id", userId)
      .single();

    const role = profile?.role ?? "";
    const isAdmin = ["super_admin", "platform_admin", "moderator"].includes(role);
    const isShelter = ["shelter_admin", "shelter_coordinator"].includes(role);

    if (!isAdmin && !isShelter) {
      return NextResponse.json(
        { error: "Forbidden: Only shelter staff or admins can accept matches" },
        { status: 403 }
      );
    }

    // Fetch match with listing and shelter
    const { data: match, error: matchError } = await adminSupabase
      .from("matches")
      .select(`
        id,
        listing_id,
        shelter_id,
        status,
        match_score,
        distance_km,
        shelters!matches_shelter_id_fkey(
          id,
          profile_id,
          name,
          address,
          capacity_kg,
          current_load_kg
        ),
        listings!matches_listing_id_fkey(
          id,
          title,
          food_category,
          quantity_kg,
          estimated_servings,
          pickup_address,
          pickup_window_start,
          pickup_window_end,
          donor_id,
          status
        )
      `)
      .eq("id", id)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    if (match.status === "accepted") {
      return NextResponse.json(
        { error: "Match is already accepted" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shelter = match.shelters as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listing = match.listings as any;

    if (!isAdmin && shelter && shelter.profile_id && shelter.profile_id !== userId) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized for this shelter" },
        { status: 403 }
      );
    }

    const nowIso = new Date().toISOString();

    // 1. Update Match record
    const { error: updateMatchError } = await adminSupabase
      .from("matches")
      .update({
        status: "accepted",
        shelter_response_at: nowIso,
      })
      .eq("id", id);

    if (updateMatchError) {
      return NextResponse.json({ error: updateMatchError.message }, { status: 500 });
    }

    // 2. Advance Listing status to 'matched'
    if (listing?.id) {
      await adminSupabase
        .from("listings")
        .update({
          status: "matched",
          updated_at: nowIso,
        })
        .eq("id", listing.id);
    }

    // 3. Update Shelter's current load
    if (shelter?.id && listing?.quantity_kg) {
      const updatedLoad = Number(shelter.current_load_kg || 0) + Number(listing.quantity_kg);
      await adminSupabase
        .from("shelters")
        .update({
          current_load_kg: updatedLoad,
        })
        .eq("id", shelter.id);
    }

    // 4. Send asynchronous email to Donor notifying them of the match accept (FR-NOTIF-01)
    if (listing?.donor_id) {
      try {
        const { data: donorProfile } = await adminSupabase
          .from("profiles")
          .select("id, email, full_name, business_name")
          .eq("id", listing.donor_id)
          .single();

        if (donorProfile?.email) {
          const donorName = donorProfile.business_name || donorProfile.full_name || "Food Donor";
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          const listingUrl = `${appUrl}/donor`;

          const emailHtml = await renderMatchAccepted({
            donorName,
            listingTitle: listing.title || "Surplus Food",
            shelterName: shelter?.name || "Local Shelter",
            shelterAddress: shelter?.address || "Registered Shelter Address",
            quantityKg: Number(listing.quantity_kg || 0),
            servings: Number(listing.estimated_servings || 0),
            pickupAddress: listing.pickup_address || "Specified Pickup Location",
            pickupWindowStart: listing.pickup_window_start,
            pickupWindowEnd: listing.pickup_window_end,
            viewListingUrl: listingUrl,
          });

          await queueEmail({
            to: donorProfile.email,
            subject: `🎉 Match Accepted: ${shelter?.name || "A shelter"} accepted your donation of ${listing.title}`,
            html: emailHtml,
            priority: "normal",
            metadata: {
              listingId: listing.id,
              userId: donorProfile.id,
              eventType: "match_accepted",
            },
          });
        }
      } catch (emailErr) {
        // Non-blocking for match accept
        console.warn("[Matches Accept] Failed to queue donor notification email:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Match accepted. Listing marked as matched and sent to ${shelter?.name || "shelter"}.`,
      matchId: id,
      listingId: listing?.id,
      shelterId: shelter?.id,
      status: "accepted",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Matches Accept] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

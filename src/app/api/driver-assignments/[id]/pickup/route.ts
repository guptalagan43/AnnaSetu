import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { queueEmail } from "@/lib/queue/emailQueue";
import { renderDriverPickedUp } from "@/lib/email/templates";

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

    // 1. Fetch assignment with listing, driver, and matched shelter
    const { data: assignment, error: assignError } = await adminSupabase
      .from("driver_assignments")
      .select(`
        id,
        driver_id,
        listing_id,
        status,
        drivers!driver_assignments_driver_id_fkey(
          id,
          profile_id,
          vehicle_type,
          profiles!drivers_profile_id_fkey(
            id,
            full_name,
            phone,
            email
          )
        ),
        listings!driver_assignments_listing_id_fkey(
          id,
          title,
          food_category,
          quantity_kg,
          estimated_servings,
          pickup_address,
          donor_id,
          status,
          matches!matches_listing_id_fkey(
            id,
            shelter_id,
            status,
            shelters!matches_shelter_id_fkey(
              id,
              name,
              address,
              profile_id
            )
          )
        )
      `)
      .eq("id", id)
      .single();

    if (assignError || !assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listing = assignment.listings as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const driver = assignment.drivers as any;
    const driverName = driver?.profiles?.full_name || "Volunteer Driver";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const match = (listing?.matches as any[])?.find(
      (m: any) => m.status === "accepted" || m.status === "auto_confirmed"
    ) || (listing?.matches as any[])?.[0];

    const shelter = match?.shelters;
    const nowIso = new Date().toISOString();

    // 2. Update assignment status to 'picked_up'
    const { error: updateAssignError } = await adminSupabase
      .from("driver_assignments")
      .update({
        status: "picked_up",
        picked_up_at: nowIso,
      })
      .eq("id", id);

    if (updateAssignError) {
      return NextResponse.json({ error: updateAssignError.message }, { status: 500 });
    }

    // 3. Advance listing status: driver_assigned -> in_transit
    if (listing?.id) {
      await adminSupabase
        .from("listings")
        .update({
          status: "in_transit",
          updated_at: nowIso,
        })
        .eq("id", listing.id);
    }

    // 4. Send asynchronous notification emails to Donor and Shelter (FR-DASH-DR03)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Email to Donor
    if (listing?.donor_id) {
      try {
        const { data: donorProfile } = await adminSupabase
          .from("profiles")
          .select("id, email, full_name, business_name")
          .eq("id", listing.donor_id)
          .maybeSingle();

        if (donorProfile?.email) {
          const donorHtml = await renderDriverPickedUp({
            recipientName: donorProfile.business_name || donorProfile.full_name || "Food Donor",
            recipientRole: "donor",
            listingTitle: listing.title,
            foodCategory: listing.food_category,
            quantityKg: Number(listing.quantity_kg || 0),
            servings: Number(listing.estimated_servings || 0),
            driverName,
            pickedUpAt: nowIso,
            destinationName: shelter?.name || "Local Shelter",
            destinationAddress: shelter?.address || "Registered Shelter Destination",
            actionUrl: `${appUrl}/donor`,
          });

          await queueEmail({
            to: donorProfile.email,
            subject: `📦 Picked Up: Your donation of ${listing.title} is now in transit`,
            html: donorHtml,
            priority: "normal",
            metadata: {
              listingId: listing.id,
              userId: donorProfile.id,
              eventType: "driver_picked_up_donor",
            },
          });
        }
      } catch (err) {
        console.warn("[Driver Pickup] Failed to queue donor email:", err);
      }
    }

    // Email to Shelter
    if (shelter?.profile_id) {
      try {
        const { data: shelterStaff } = await adminSupabase
          .from("profiles")
          .select("id, email, full_name")
          .eq("id", shelter.profile_id)
          .maybeSingle();

        if (shelterStaff?.email) {
          const shelterHtml = await renderDriverPickedUp({
            recipientName: shelterStaff.full_name || shelter.name,
            recipientRole: "shelter",
            listingTitle: listing.title,
            foodCategory: listing.food_category,
            quantityKg: Number(listing.quantity_kg || 0),
            servings: Number(listing.estimated_servings || 0),
            driverName,
            pickedUpAt: nowIso,
            destinationName: shelter.name,
            destinationAddress: shelter.address,
            actionUrl: `${appUrl}/shelter`,
          });

          await queueEmail({
            to: shelterStaff.email,
            subject: `🚚 In Transit: ${listing.title} has been picked up and is heading to ${shelter.name}`,
            html: shelterHtml,
            priority: "normal",
            metadata: {
              listingId: listing.id,
              userId: shelterStaff.id,
              eventType: "driver_picked_up_shelter",
            },
          });
        }
      } catch (err) {
        console.warn("[Driver Pickup] Failed to queue shelter email:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Listing marked as picked up. Status updated to in_transit.",
      assignmentId: id,
      listingId: listing?.id,
      status: "picked_up",
      listingStatus: "in_transit",
      picked_up_at: nowIso,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

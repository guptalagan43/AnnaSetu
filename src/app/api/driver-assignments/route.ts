import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { queueEmail } from "@/lib/queue/emailQueue";
import { renderDriverAssigned } from "@/lib/email/templates";

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
    const statusParam = searchParams.get("status");

    // Fetch user profile role
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    const role = profile?.role ?? "";
    const isAdmin = ["super_admin", "platform_admin", "moderator"].includes(role);
    const isDriver = role.includes("driver");

    let query = adminSupabase
      .from("driver_assignments")
      .select(`
        id,
        driver_id,
        listing_id,
        status,
        assigned_by,
        picked_up_at,
        delivered_at,
        created_at,
        drivers!driver_assignments_driver_id_fkey(
          id,
          profile_id,
          vehicle_type,
          is_available,
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
          pickup_window_start,
          pickup_window_end,
          expiry_time,
          ers_score,
          status,
          donor_pin,
          donor_id,
          matches!matches_listing_id_fkey(
            id,
            shelter_id,
            status,
            shelters!matches_shelter_id_fkey(
              id,
              name,
              address
            )
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (isDriver && !isAdmin) {
      // Find driver profile ID
      const { data: myDriver } = await adminSupabase
        .from("drivers")
        .select("id")
        .eq("profile_id", userId)
        .maybeSingle();

      if (myDriver) {
        query = query.eq("driver_id", myDriver.id);
      } else {
        return NextResponse.json({ data: [] });
      }
    }

    if (statusParam && statusParam !== "ALL") {
      query = query.eq("status", statusParam.toLowerCase());
    }

    const { data: assignments, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: assignments || [] });
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

    // Check authorization
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    const role = profile?.role ?? "";
    const isAdmin = ["super_admin", "platform_admin", "moderator"].includes(role);

    const body = await request.json();
    const {
      driver_id,
      listing_id,
      assigned_by = isAdmin ? "admin" : "agent",
    } = body;

    if (!driver_id || !listing_id) {
      return NextResponse.json(
        { error: "driver_id and listing_id are required" },
        { status: 400 }
      );
    }

    // 1. Fetch listing details
    const { data: listing, error: listingError } = await adminSupabase
      .from("listings")
      .select(`
        id,
        title,
        food_category,
        quantity_kg,
        estimated_servings,
        pickup_address,
        pickup_window_start,
        pickup_window_end,
        ers_score,
        status,
        donor_id,
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
      `)
      .eq("id", listing_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // 2. Fetch driver profile & contact
    const { data: driver, error: driverError } = await adminSupabase
      .from("drivers")
      .select(`
        id,
        vehicle_type,
        profiles!drivers_profile_id_fkey(
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq("id", driver_id)
      .single();

    if (driverError || !driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const driverProfile = driver.profiles as any;

    // 3. Find matched shelter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeMatch = (listing.matches as any[])?.find(
      (m: any) => m.status === "accepted" || m.status === "auto_confirmed" || m.status === "pending"
    ) || (listing.matches as any[])?.[0];

    const shelter = activeMatch?.shelters;

    // 4. Fetch donor info
    const { data: donorProfile } = await adminSupabase
      .from("profiles")
      .select("full_name, business_name, email")
      .eq("id", listing.donor_id)
      .maybeSingle();

    const donorName = donorProfile?.business_name || donorProfile?.full_name || "Food Donor";
    const shelterName = shelter?.name || "Local Shelter";
    const dropoffAddress = shelter?.address || "Shelter Delivery Center";

    // 5. Create or update driver assignment
    const { data: assignment, error: assignError } = await adminSupabase
      .from("driver_assignments")
      .insert({
        driver_id,
        listing_id,
        assigned_by,
        status: "assigned",
      })
      .select()
      .single();

    if (assignError) {
      return NextResponse.json({ error: assignError.message }, { status: 500 });
    }

    // 6. Update listing status: matched -> driver_assigned
    await adminSupabase
      .from("listings")
      .update({
        status: "driver_assigned",
        updated_at: new Date().toISOString(),
      })
      .eq("id", listing_id);

    // 7. Dispatch asynchronous notification emails (FR-NOTIF-01)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Email to Driver
    if (driverProfile?.email) {
      try {
        const driverEmailHtml = await renderDriverAssigned({
          recipientName: driverProfile.full_name || "Volunteer Driver",
          recipientRole: "driver",
          listingTitle: listing.title,
          foodCategory: listing.food_category,
          quantityKg: Number(listing.quantity_kg || 0),
          servings: Number(listing.estimated_servings || 0),
          ersScore: Number(listing.ers_score || 0),
          pickupAddress: listing.pickup_address,
          dropoffAddress,
          shelterName,
          donorName,
          actionUrl: `${appUrl}/driver`,
        });

        await queueEmail({
          to: driverProfile.email,
          subject: `🚗 Rescue Run Assigned: ${listing.title} (${listing.quantity_kg} kg)`,
          html: driverEmailHtml,
          priority: "high",
          metadata: {
            listingId: listing.id,
            userId: driverProfile.id,
            eventType: "driver_assigned",
          },
        });
      } catch (err) {
        console.warn("[Driver Assignment] Failed to queue driver email:", err);
      }
    }

    // Email to Shelter (if shelter coordinator email available)
    if (shelter?.profile_id) {
      try {
        const { data: shelterStaff } = await adminSupabase
          .from("profiles")
          .select("id, email, full_name")
          .eq("id", shelter.profile_id)
          .maybeSingle();

        if (shelterStaff?.email) {
          const shelterEmailHtml = await renderDriverAssigned({
            recipientName: shelterStaff.full_name || shelterName,
            recipientRole: "shelter",
            listingTitle: listing.title,
            foodCategory: listing.food_category,
            quantityKg: Number(listing.quantity_kg || 0),
            servings: Number(listing.estimated_servings || 0),
            ersScore: Number(listing.ers_score || 0),
            pickupAddress: listing.pickup_address,
            dropoffAddress,
            shelterName,
            donorName,
            actionUrl: `${appUrl}/shelter`,
          });

          await queueEmail({
            to: shelterStaff.email,
            subject: `🚚 Driver Dispatched: ${driverProfile?.full_name || "Volunteer"} assigned for ${listing.title}`,
            html: shelterEmailHtml,
            priority: "normal",
            metadata: {
              listingId: listing.id,
              userId: shelterStaff.id,
              eventType: "driver_dispatched_shelter",
            },
          });
        }
      } catch (err) {
        console.warn("[Driver Assignment] Failed to queue shelter email:", err);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Driver assigned successfully. Status updated to driver_assigned.",
      assignment,
      listingId: listing.id,
      driverId: driver_id,
      status: "driver_assigned",
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

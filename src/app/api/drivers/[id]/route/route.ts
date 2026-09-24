import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseCoordinates } from "@/lib/ers/coordinates";
import { optimizeRoute, RouteStop } from "@/lib/routing/osrm";

export async function GET(
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

    // 1. Identify Target Driver
    let driverId = id;
    let driverRecord = null;

    if (id === "me" || id === "current" || id === "self") {
      const { data: driver } = await adminSupabase
        .from("drivers")
        .select("*, profiles!drivers_profile_id_fkey(*)")
        .eq("profile_id", userId)
        .maybeSingle();

      if (driver) {
        driverId = driver.id;
        driverRecord = driver;
      }
    } else {
      // Check if `id` is a driver_id
      const { data: driver } = await adminSupabase
        .from("drivers")
        .select("*, profiles!drivers_profile_id_fkey(*)")
        .eq("id", id)
        .maybeSingle();

      if (driver) {
        driverRecord = driver;
      } else {
        // Check if `id` is an assignment_id
        const { data: assignment } = await adminSupabase
          .from("driver_assignments")
          .select("driver_id, drivers!driver_assignments_driver_id_fkey(*, profiles!drivers_profile_id_fkey(*))")
          .eq("id", id)
          .maybeSingle();

        if (assignment && assignment.driver_id) {
          driverId = assignment.driver_id;
          driverRecord = assignment.drivers;
        }
      }
    }

    // 2. Determine Driver Start Location
    const searchParams = request.nextUrl.searchParams;
    const latQuery = searchParams.get("lat");
    const lngQuery = searchParams.get("lng");

    let startLocation = { latitude: 12.9716, longitude: 77.5946 }; // Default: Bangalore Central

    if (latQuery && lngQuery && !isNaN(Number(latQuery)) && !isNaN(Number(lngQuery))) {
      startLocation = { latitude: Number(latQuery), longitude: Number(lngQuery) };
    } else if (driverRecord?.location) {
      const parsedDriverCoords = parseCoordinates(driverRecord.location);
      if (parsedDriverCoords) {
        startLocation = {
          latitude: parsedDriverCoords.lat,
          longitude: parsedDriverCoords.lng,
        };
      }
    }

    // 3. Fetch Active Driver Assignments (status: assigned or picked_up)
    let assignmentsQuery = adminSupabase
      .from("driver_assignments")
      .select(`
        id,
        driver_id,
        listing_id,
        status,
        picked_up_at,
        created_at,
        listings!driver_assignments_listing_id_fkey(
          id,
          title,
          food_category,
          quantity_kg,
          estimated_servings,
          pickup_address,
          pickup_location,
          ers_score,
          donor_pin,
          status,
          matches!matches_listing_id_fkey(
            id,
            shelter_id,
            status,
            shelters!matches_shelter_id_fkey(
              id,
              name,
              address,
              location
            )
          )
        )
      `)
      .in("status", ["assigned", "picked_up"]);

    if (driverRecord) {
      assignmentsQuery = assignmentsQuery.eq("driver_id", driverRecord.id);
    } else if (driverId && driverId !== "demo") {
      assignmentsQuery = assignmentsQuery.eq("driver_id", driverId);
    }

    const { data: rawAssignments, error: queryError } = await assignmentsQuery;

    if (queryError) {
      return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    const assignments = rawAssignments || [];

    // 4. Construct Stops List
    const stops: RouteStop[] = [];

    for (const assignment of assignments) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const listing = assignment.listings as any;
      if (!listing) continue;

      const listingCoords = parseCoordinates(listing.pickup_location) || {
        lat: 12.975 + Math.random() * 0.04 - 0.02,
        lng: 77.595 + Math.random() * 0.04 - 0.02,
      };

      const activeMatch = listing.matches?.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (m: any) => m.status === "accepted" || m.status === "auto_confirmed" || m.status === "pending"
      ) || listing.matches?.[0];

      const shelter = activeMatch?.shelters;
      const shelterCoords = parseCoordinates(shelter?.location) || {
        lat: listingCoords.lat + (Math.random() * 0.03 - 0.015),
        lng: listingCoords.lng + (Math.random() * 0.03 - 0.015),
      };

      const pickupStopId = `pickup-${listing.id}`;
      const deliveryStopId = `delivery-${listing.id}`;

      // If status is "assigned", both pickup AND delivery are needed
      if (assignment.status === "assigned") {
        // Pickup stop
        stops.push({
          id: pickupStopId,
          assignment_id: assignment.id,
          type: "pickup",
          name: `Pickup: ${listing.title}`,
          address: listing.pickup_address || "Donor Location",
          latitude: listingCoords.lat,
          longitude: listingCoords.lng,
          quantity_kg: Number(listing.quantity_kg) || 0,
          ers_score: Number(listing.ers_score) || 0,
          food_category: listing.food_category,
          donor_pin: listing.donor_pin,
          status: "pending_pickup",
        });

        // Delivery stop (must follow pickup)
        stops.push({
          id: deliveryStopId,
          assignment_id: assignment.id,
          type: "delivery",
          name: `Deliver: ${shelter?.name || "Shelter Center"}`,
          address: shelter?.address || "Shelter Delivery Point",
          latitude: shelterCoords.lat,
          longitude: shelterCoords.lng,
          quantity_kg: Number(listing.quantity_kg) || 0,
          ers_score: Number(listing.ers_score) || 0,
          food_category: listing.food_category,
          associated_pickup_id: pickupStopId,
          status: "pending_delivery",
        });
      } else if (assignment.status === "picked_up") {
        // Food already on-board, only delivery stop is remaining!
        stops.push({
          id: deliveryStopId,
          assignment_id: assignment.id,
          type: "delivery",
          name: `Deliver: ${shelter?.name || "Shelter Center"}`,
          address: shelter?.address || "Shelter Delivery Point",
          latitude: shelterCoords.lat,
          longitude: shelterCoords.lng,
          quantity_kg: Number(listing.quantity_kg) || 0,
          ers_score: Number(listing.ers_score) || 0,
          food_category: listing.food_category,
          status: "in_transit",
        });
      }
    }

    // 5. If driver has no live assignments, provide demonstration rescue stops
    if (stops.length === 0) {
      stops.push(
        {
          id: "demo-pickup-1",
          type: "pickup",
          name: "Pickup: 45 Meals — The Oberoi Bakery",
          address: "37-39, MG Road, Yellappa Garden, Bengaluru, Karnataka 560001",
          latitude: 12.9733,
          longitude: 77.6192,
          quantity_kg: 18.5,
          ers_score: 84,
          food_category: "cooked_meals",
          donor_pin: "4821",
          status: "assigned",
        },
        {
          id: "demo-delivery-1",
          type: "delivery",
          name: "Deliver: Asha Kiran Shelter",
          address: "8th Main Road, Sampangiram Nagar, Bengaluru, Karnataka 560027",
          latitude: 12.9648,
          longitude: 77.5891,
          quantity_kg: 18.5,
          associated_pickup_id: "demo-pickup-1",
          status: "pending_pickup",
        },
        {
          id: "demo-pickup-2",
          type: "pickup",
          name: "Pickup: 30kg Fresh Produce — Metro Fresh Mart",
          address: "100ft Road, Indiranagar, Bengaluru, Karnataka 560038",
          latitude: 12.9784,
          longitude: 77.6408,
          quantity_kg: 30.0,
          ers_score: 55,
          food_category: "raw_produce",
          donor_pin: "1923",
          status: "assigned",
        },
        {
          id: "demo-delivery-2",
          type: "delivery",
          name: "Deliver: Snehadhara Foundation",
          address: "Ulsoor Lake Road, Bengaluru, Karnataka 560042",
          latitude: 12.9817,
          longitude: 77.6212,
          quantity_kg: 30.0,
          associated_pickup_id: "demo-pickup-2",
          status: "pending_pickup",
        }
      );
    }

    // 6. Optimize Route using OSRM + Nearest-Neighbor
    const optimized = await optimizeRoute(stops, startLocation);

    // 7. Persist route stops JSONB to active assignments if present
    if (assignments.length > 0) {
      for (const assignment of assignments) {
        const assignmentStops = optimized.stops.filter((s) => s.assignment_id === assignment.id);
        if (assignmentStops.length > 0) {
          await adminSupabase
            .from("driver_assignments")
            .update({
              route_stops: assignmentStops,
            })
            .eq("id", assignment.id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      driver_id: driverId,
      driver_name: driverRecord?.profiles?.full_name || "Volunteer Driver",
      vehicle_type: driverRecord?.vehicle_type || "bike",
      start_location: startLocation,
      total_stops: optimized.stops.length,
      total_distance_km: optimized.total_distance_km,
      total_duration_minutes: optimized.total_duration_minutes,
      route_geometry: optimized.route_geometry,
      stops: optimized.stops,
      fallback_used: optimized.fallback_used,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

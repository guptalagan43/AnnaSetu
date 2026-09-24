import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deliveryChecklistSchema } from "@/lib/validators/checklist.schema";
import { queueEmail } from "@/lib/queue/emailQueue";
import {
  renderDeliveryAccepted,
  renderDeliveryDisputed,
} from "@/lib/email/templates";

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
    const listingId = searchParams.get("listing_id");

    const adminSupabase = createAdminClient();
    let query = adminSupabase
      .from("delivery_receipts")
      .select(`
        *,
        listings!delivery_receipts_listing_id_fkey(
          id,
          title,
          food_category,
          quantity_kg,
          donor_pin,
          status
        ),
        profiles!delivery_receipts_completed_by_fkey(
          id,
          full_name,
          role
        )
      `)
      .order("created_at", { ascending: false });

    if (listingId) {
      query = query.eq("listing_id", listingId);
    }

    const { data: receipts, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: receipts || [] });
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

    // 1. Validate Schema
    const validation = deliveryChecklistSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Checklist validation failed",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      listing_id,
      quantity_ok,
      item_correct,
      packaging_ok,
      food_condition_ok,
      donor_pin,
      notes,
      discrepancy_type = "unspecified",
    } = validation.data;

    // 2. Query Listing and Matched Shelter/Driver
    const { data: listing, error: listingError } = await adminSupabase
      .from("listings")
      .select(`
        id,
        title,
        food_category,
        quantity_kg,
        estimated_servings,
        donor_pin,
        donor_id,
        donor_verification_id,
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
        ),
        driver_assignments!driver_assignments_listing_id_fkey(
          id,
          driver_id,
          status
        )
      `)
      .eq("id", listing_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeMatch = (listing.matches as any[])?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (m: any) => m.status === "accepted" || m.status === "auto_confirmed" || m.status === "pending"
    ) || (listing.matches as any[])?.[0];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const activeAssignment = (listing.driver_assignments as any[])?.[0];
    const shelter = activeMatch?.shelters;
    const shelterName = shelter?.name || "Local Shelter";
    const shelterAddress = shelter?.address || "Shelter Delivery Center";

    // 3. Verify Donor PIN
    const normalizedEnteredPin = donor_pin.trim();
    const normalizedExpectedPin = (listing.donor_pin || "").trim();
    const pinConfirmed = normalizedEnteredPin.length === 4 && normalizedEnteredPin === normalizedExpectedPin;

    // 4. Determine Checklist Outcome
    const checklistPassed =
      quantity_ok && item_correct && packaging_ok && food_condition_ok && pinConfirmed;

    // 5. Insert Delivery Receipt Record
    const { data: receipt, error: receiptError } = await adminSupabase
      .from("delivery_receipts")
      .insert({
        listing_id,
        match_id: activeMatch?.id || null,
        driver_assignment_id: activeAssignment?.id || null,
        completed_by: userId,
        quantity_ok,
        item_correct,
        packaging_ok,
        food_condition_ok,
        pin_confirmed: pinConfirmed,
        notes: notes || null,
      })
      .select()
      .single();

    if (receiptError) {
      console.error("[Delivery Receipt] Insert error:", receiptError);
      return NextResponse.json({ error: receiptError.message }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // 6. Fetch Donor Profile for Notifications
    const { data: donorProfile } = await adminSupabase
      .from("profiles")
      .select("id, full_name, business_name, email")
      .eq("id", listing.donor_id)
      .maybeSingle();

    const donorName = donorProfile?.business_name || donorProfile?.full_name || "Food Donor";

    // 7. Branch On Result: Pass vs Fail
    if (checklistPassed) {
      // SUCCESS BRANCH
      // Advance listing status to 'delivered'
      await adminSupabase
        .from("listings")
        .update({
          status: "delivered",
          updated_at: new Date().toISOString(),
        })
        .eq("id", listing_id);

      // Advance driver assignment to 'delivered' if not already
      if (activeAssignment?.id) {
        await adminSupabase
          .from("driver_assignments")
          .update({
            status: "delivered",
            delivered_at: new Date().toISOString(),
          })
          .eq("id", activeAssignment.id);
      }

      // Calculate Impact
      const quantityKg = Number(listing.quantity_kg) || 0;
      const servings = Number(listing.estimated_servings) || Math.round(quantityKg * 2.5);
      const co2eAvoidedKg = Number((quantityKg * 2.5).toFixed(2));

      // Record to impact_totals table
      try {
        await adminSupabase.from("impact_totals").insert({
          listing_id: listing.id,
          donor_id: listing.donor_id,
          shelter_id: activeMatch?.shelter_id || null,
          meals_rescued: servings,
          weight_kg: quantityKg,
          co2e_avoided_kg: co2eAvoidedKg,
        });
      } catch (impactErr) {
        console.warn("[Delivery Receipt] Failed to record to impact_totals:", impactErr);
      }

      // Dispatch Acceptance Email to Donor
      if (donorProfile?.email) {
        try {
          const emailHtml = await renderDeliveryAccepted({
            donorName,
            listingTitle: listing.title,
            quantityKg,
            servings,
            co2eAvoidedKg,
            shelterName,
            shelterAddress,
            deliveryDate: new Date().toLocaleString("en-IN"),
            pinVerified: pinConfirmed,
            actionUrl: `${appUrl}/donor`,
          });

          await queueEmail({
            to: donorProfile.email,
            subject: `🎉 Food Rescue Confirmed: ${listing.title} (${quantityKg} kg) Accepted!`,
            html: emailHtml,
            priority: "high",
            metadata: {
              listingId: listing.id,
              userId: donorProfile.id,
              eventType: "delivery_accepted",
            },
          });
        } catch (emailErr) {
          console.warn("[Delivery Receipt] Failed to queue acceptance email:", emailErr);
        }
      }

      return NextResponse.json({
        success: true,
        checklist_passed: true,
        status: "delivered",
        pin_confirmed: pinConfirmed,
        message: "Delivery inspected and accepted! Food rescued successfully.",
        receipt,
        impact: {
          quantity_kg: quantityKg,
          servings,
          co2e_avoided_kg: co2eAvoidedKg,
        },
      }, { status: 201 });
    } else {
      // FAILURE / DISPUTE BRANCH
      // Update listing status to 'disputed'
      await adminSupabase
        .from("listings")
        .update({
          status: "disputed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", listing_id);

      // Check and update violation count in donor_verifications
      let verificationQuery = adminSupabase.from("donor_verifications").select("id, profile_id, violation_count, status");
      if (listing.donor_verification_id) {
        verificationQuery = verificationQuery.eq("id", listing.donor_verification_id);
      } else {
        verificationQuery = verificationQuery.eq("profile_id", listing.donor_id);
      }

      const { data: verification } = await verificationQuery.maybeSingle();
      const currentViolations = Number(verification?.violation_count) || 0;
      const newViolationCount = currentViolations + 1;

      let actionTaken: "warning_issued" | "account_suspended" = "warning_issued";

      if (newViolationCount >= 2) {
        // SECOND VIOLATION: ACCOUNT SUSPENSION & CANCEL ACTIVE LISTINGS
        actionTaken = "account_suspended";

        if (verification?.id) {
          await adminSupabase
            .from("donor_verifications")
            .update({
              violation_count: newViolationCount,
              status: "suspended",
            })
            .eq("id", verification.id);
        }

        // Cancel all active listings for this donor
        await adminSupabase
          .from("listings")
          .update({
            status: "cancelled",
            updated_at: new Date().toISOString(),
          })
          .eq("donor_id", listing.donor_id)
          .in("status", ["listed", "matched", "driver_assigned", "in_transit"]);

        console.warn(`[Violation Policy] Donor ${listing.donor_id} suspended due to 2nd checklist violation.`);
      } else {
        // FIRST VIOLATION: FORMAL WARNING
        actionTaken = "warning_issued";

        if (verification?.id) {
          await adminSupabase
            .from("donor_verifications")
            .update({
              violation_count: 1,
            })
            .eq("id", verification.id);
        }

        console.warn(`[Violation Policy] Donor ${listing.donor_id} issued 1st strike warning.`);
      }

      // Dispatch Warning / Suspension Email to Donor
      if (donorProfile?.email) {
        try {
          const emailHtml = await renderDeliveryDisputed({
            donorName,
            listingTitle: listing.title,
            shelterName,
            violationNumber: newViolationCount,
            discrepancyType: !pinConfirmed
              ? "Donor PIN Verification Failed"
              : discrepancy_type,
            volunteerNotes: notes || "Checklist criteria not satisfied during delivery inspection.",
            actionTaken,
            actionUrl: `${appUrl}/donor`,
          });

          await queueEmail({
            to: donorProfile.email,
            subject:
              actionTaken === "account_suspended"
                ? `🚫 AnnaSetu Account Suspended: Multiple discrepancies reported for ${listing.title}`
                : `⚠️ Notice: Delivery Discrepancy Reported for ${listing.title}`,
            html: emailHtml,
            priority: "high",
            metadata: {
              listingId: listing.id,
              userId: donorProfile.id,
              eventType: `delivery_disputed_v${newViolationCount}`,
            },
          });
        } catch (emailErr) {
          console.warn("[Delivery Receipt] Failed to queue dispute email:", emailErr);
        }
      }

      // Alert Admin Email
      const adminEmail = process.env.ADMIN_EMAIL || "admin@annasetu.in";
      try {
        await queueEmail({
          to: adminEmail,
          subject: `[CRITICAL DISPUTE] ${shelterName} rejected delivery for Listing ${listing.title}`,
          html: `<div style="font-family:monospace;padding:16px;">
            <h2>Delivery Discrepancy Flagged</h2>
            <p><strong>Listing:</strong> ${listing.title} (${listing.id})</p>
            <p><strong>Donor:</strong> ${donorName} (${listing.donor_id})</p>
            <p><strong>Shelter:</strong> ${shelterName}</p>
            <p><strong>PIN Verified:</strong> ${pinConfirmed ? "YES" : "NO (MISMATCH)"}</p>
            <p><strong>Violation Count:</strong> ${newViolationCount} (Action: ${actionTaken})</p>
            <p><strong>Notes:</strong> ${notes || "None"}</p>
          </div>`,
          priority: "high",
          metadata: {
            listingId: listing.id,
            eventType: "admin_dispute_alert",
          },
        });
      } catch (adminErr) {
        console.warn("[Delivery Receipt] Failed to queue admin dispute alert:", adminErr);
      }

      return NextResponse.json({
        success: false,
        checklist_passed: false,
        status: "disputed",
        pin_confirmed: pinConfirmed,
        violation_count: newViolationCount,
        action_taken: actionTaken,
        message:
          actionTaken === "account_suspended"
            ? "Checklist failed. Second violation recorded: Donor account has been suspended and active listings cancelled."
            : "Checklist failed. Delivery recorded as disputed and formal warning issued to donor.",
        receipt,
      }, { status: 200 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

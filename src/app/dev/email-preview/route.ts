/**
 * Dev-only email preview route at /dev/email-preview
 * Renders any email template as raw HTML for visual review in the browser.
 * Blocked in production via NODE_ENV check.
 *
 * Usage: /dev/email-preview?template=verification_submitted
 * Templates: verification_submitted | verification_approved | verification_rejected | welcome_donor
 */
import { NextRequest, NextResponse } from "next/server";
import {
  renderVerificationSubmitted,
  renderVerificationApproved,
  renderVerificationRejected,
  renderWelcomeDonor,
  renderERSAlert,
  renderMatchAccepted,
  renderCoordinatorInvite,
  renderDriverAssigned,
  renderDriverPickedUp,
} from "@/lib/email/templates";

// Sample data for each template preview
const SAMPLE_DATA = {
  verification_submitted: () =>
    renderVerificationSubmitted({
      adminName: "Admin",
      businessName: "Spice Garden Restaurant",
      businessType: "Restaurant",
      contactEmail: "spicegarden@example.com",
      fssaiNumber: "12345678901234",
      submittedAt: new Date().toISOString(),
    }),

  verification_approved: () =>
    renderVerificationApproved({
      donorName: "Ravi Sharma",
      businessName: "Spice Garden Restaurant",
      businessType: "Restaurant",
      fssaiNumber: "12345678901234",
      reviewedAt: new Date().toISOString(),
      reviewedBy: "Admin Team",
      loginUrl: "http://localhost:3000/login",
    }),

  verification_rejected: () =>
    renderVerificationRejected({
      donorName: "Ravi Sharma",
      businessName: "Spice Garden Restaurant",
      rejectionReason:
        "The submitted FSSAI license document appears to be expired. Please renew your FSSAI license and re-apply with the updated document. Additionally, the GST certificate provided does not match the business address on the application.",
      reviewedAt: new Date().toISOString(),
    }),

  welcome_donor: () =>
    renderWelcomeDonor({
      donorName: "Ravi Sharma",
      businessName: "Spice Garden Restaurant",
      dashboardUrl: "http://localhost:3000/donor",
    }),

  ers_alert: () =>
    renderERSAlert({
      donorName: "Ravi Sharma",
      listingTitle: "Surplus Chicken Biryani",
      ersScore: 84,
      foodCategory: "Cooked rice dishes / curries",
      quantityKg: 15,
      servings: 35,
      expiryTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      actionUrl: "http://localhost:3000/donor",
      recipientType: "donor",
    }),

  match_accepted: () =>
    renderMatchAccepted({
      donorName: "Ravi Sharma",
      listingTitle: "Surplus Vegetable Biryani Trays",
      shelterName: "Hope Community Shelter",
      shelterAddress: "123 Hope Way, Indiranagar, Bengaluru",
      quantityKg: 20,
      servings: 50,
      pickupAddress: "Spice Garden Restaurant, MG Road, Bengaluru",
      pickupWindowStart: new Date().toISOString(),
      pickupWindowEnd: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      viewListingUrl: "http://localhost:3000/donor",
    }),

  coordinator_invite: () =>
    renderCoordinatorInvite({
      inviteeEmail: "priya@hopeshelter.org",
      shelterName: "Hope Community Shelter",
      inviterName: "Anil Kumar (Shelter Admin)",
      role: "Shelter Coordinator",
      inviteLink: "http://localhost:3000/register?token=sample123&role=shelter_coordinator",
      expiresInDays: 7,
    }),

  driver_assigned: () =>
    renderDriverAssigned({
      recipientName: "Priya Sharma",
      recipientRole: "driver",
      listingTitle: "Surplus Cooked Vegetable Biryani",
      foodCategory: "Cooked rice dishes / curries",
      quantityKg: 25,
      servings: 60,
      ersScore: 78,
      pickupAddress: "Spice Garden Restaurant, MG Road, Bengaluru",
      dropoffAddress: "123 Hope Way, Indiranagar, Bengaluru",
      shelterName: "Hope Community Shelter",
      donorName: "Spice Garden Restaurant",
      actionUrl: "http://localhost:3000/driver",
    }),

  driver_picked_up: () =>
    renderDriverPickedUp({
      recipientName: "Ravi Sharma",
      recipientRole: "donor",
      listingTitle: "Surplus Cooked Vegetable Biryani",
      foodCategory: "Cooked rice dishes / curries",
      quantityKg: 25,
      servings: 60,
      driverName: "Priya Sharma (Motorcycle)",
      pickedUpAt: new Date().toISOString(),
      destinationName: "Hope Community Shelter",
      destinationAddress: "123 Hope Way, Indiranagar, Bengaluru",
      actionUrl: "http://localhost:3000/donor",
    }),
} as const;

type TemplateName = keyof typeof SAMPLE_DATA;

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Block in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const url = new URL(request.url);
  const template = (url.searchParams.get("template") ?? "verification_submitted") as TemplateName;

  if (!(template in SAMPLE_DATA)) {
    const available = Object.keys(SAMPLE_DATA).join(", ");
    return NextResponse.json(
      {
        error: `Unknown template '${template}'`,
        available,
      },
      { status: 400 }
    );
  }

  const html = await SAMPLE_DATA[template]();

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

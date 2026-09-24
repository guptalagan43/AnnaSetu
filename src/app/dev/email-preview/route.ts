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

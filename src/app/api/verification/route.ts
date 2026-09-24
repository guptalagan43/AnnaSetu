import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verificationSchema } from "@/lib/validators/verification.schema";
import { ZodError } from "zod";
import { queueEmail } from "@/lib/queue/emailQueue";
import { renderVerificationSubmitted } from "@/lib/email/templates";

// GET /api/verification — list all verifications (admin only)
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    // Check auth
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile to check admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    const adminRoles = ["super_admin", "platform_admin", "moderator"];
    if (!profile || !adminRoles.includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
    }

    // Parse query params
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "pending_review";
    const search = url.searchParams.get("search") || "";
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("donor_verifications")
      .select(
        `
        id,
        business_name,
        business_type,
        contact_person_name,
        contact_email,
        contact_phone,
        fssai_number,
        fssai_expiry,
        status,
        submitted_at,
        city,
        state,
        avg_daily_surplus
      `,
        { count: "exact" }
      )
      .eq("status", status)
      .order("submitted_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.ilike("business_name", `%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("[Verification GET] DB error:", error);
      return NextResponse.json({ error: "Failed to fetch verifications" }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        items: data,
        total: count ?? 0,
        page,
        limit,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Verification GET] Unexpected:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/verification — submit a new donor verification request
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    // Check auth
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized — please log in first" }, { status: 401 });
    }

    // Check that user has donor role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, display_name")
      .eq("id", session.user.id)
      .single();

    const donorRoles = ["donor_admin", "donor_staff"];
    if (!profile || !donorRoles.includes(profile.role)) {
      return NextResponse.json(
        { error: "Only donor accounts can submit verification requests", code: "WRONG_ROLE" },
        { status: 403 }
      );
    }

    // Check for existing pending/approved verification
    const { data: existing } = await supabase
      .from("donor_verifications")
      .select("id, status")
      .eq("user_id", session.user.id)
      .in("status", ["pending_review", "under_review", "approved"])
      .maybeSingle();

    if (existing) {
      const statusLabel = existing.status === "approved" ? "already approved" : "currently under review";
      return NextResponse.json(
        {
          error: `Your account is ${statusLabel}. You cannot submit a new application.`,
          code: "DUPLICATE_APPLICATION",
        },
        { status: 409 }
      );
    }

    // Parse + validate body
    const body: unknown = await request.json();
    const parsed = verificationSchema.parse(body);

    // Check FSSAI expiry not in the past
    const expiryDate = new Date(parsed.fssai_expiry);
    if (expiryDate < new Date()) {
      return NextResponse.json(
        { error: "FSSAI license has expired — please renew before applying", field: "fssai_expiry" },
        { status: 422 }
      );
    }

    // Insert into donor_verifications table
    const { data: verification, error: insertError } = await supabase
      .from("donor_verifications")
      .insert({
        user_id: session.user.id,
        profile_id: session.user.id,
        business_name: parsed.business_name,
        business_type: parsed.business_type,
        contact_person_name: parsed.contact_person_name,
        contact_email: parsed.contact_email,
        contact_phone: parsed.contact_phone,
        why_donate: parsed.why_donate || null,
        fssai_number: parsed.fssai_number,
        fssai_expiry: parsed.fssai_expiry,
        fssai_doc_url: parsed.fssai_doc_url || null,
        gst_number: parsed.gst_number || null,
        gst_doc_url: parsed.gst_doc_url || null,
        pan_number: parsed.pan_number,
        pan_doc_url: parsed.pan_doc_url || null,
        address: parsed.address,
        city: parsed.city,
        state: parsed.state,
        pincode: parsed.pincode,
        // PostGIS geography point (both location and pickup_location for schema compatibility)
        location: `SRID=4326;POINT(${parsed.lng} ${parsed.lat})`,
        pickup_location: `SRID=4326;POINT(${parsed.lng} ${parsed.lat})`,
        operating_hours_start: parsed.operating_hours_start,
        operating_hours_end: parsed.operating_hours_end,
        operating_days: parsed.operating_days,
        avg_daily_surplus: parsed.avg_daily_surplus,
        food_types: parsed.food_types,
        pickup_notes: parsed.pickup_notes || null,
        status: "pending_review",
        submitted_at: new Date().toISOString(),
      })
      .select("id, status, submitted_at")
      .single();

    if (insertError) {
      console.error("[Verification POST] Insert error:", { user_id: session.user.id, error: insertError });
      return NextResponse.json({ error: "Failed to save application — please try again" }, { status: 500 });
    }

    console.info("[Verification POST] New application submitted:", {
      id: verification.id,
      user_id: session.user.id,
      business: parsed.business_name,
    });

    // Notify admin of new verification submission (Phase 06) — non-fatal
    const adminEmail = process.env.ADMIN_EMAIL ?? process.env.SMTP_USER ?? "";
    if (adminEmail) {
      (async () => {
        const html = await renderVerificationSubmitted({
          adminName: "Admin",
          businessName: parsed.business_name,
          businessType: parsed.business_type,
          contactEmail: parsed.contact_email,
          fssaiNumber: parsed.fssai_number,
          submittedAt: new Date().toISOString(),
        });

        await queueEmail({
          to: adminEmail,
          subject: `🔔 New verification request: ${parsed.business_name}`,
          html,
          priority: "high",
          metadata: { userId: session.user.id, eventType: "verification_submitted" },
        });
      })().catch((err) => {
        console.error("[Verification POST] Admin email queue error (non-fatal):", err);
      });
    }

    return NextResponse.json(
      {
        data: {
          id: verification.id,
          status: verification.status,
          submitted_at: verification.submitted_at,
          message: "Your verification request has been received. We'll review and contact you within 2–3 business days.",
        },
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
    console.error("[Verification POST] Unexpected:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

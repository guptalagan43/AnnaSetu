import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  validateOverrideReason,
  canOverrideAction,
  determineReversalPlan,
  DEMO_AGENT_LOGS,
} from "@/lib/dispatcher/override";
import { renderAgentOverrideAlert } from "@/lib/email/templates";
import { queueEmail } from "@/lib/queue/emailQueue";

const ADMIN_ROLES = ["super_admin", "platform_admin", "moderator"];

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    let adminUserId = session?.user?.id || "admin-system";
    let adminName = "Platform Administrator";

    if (session) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, role, full_name, display_name")
        .eq("id", session.user.id)
        .single();

      if (!profile || !ADMIN_ROLES.includes(profile.role)) {
        return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
      }

      adminName = profile.display_name || profile.full_name || "Platform Admin";
      adminUserId = profile.id;
    }

    // 1. Validate request body
    const body = await request.json().catch(() => ({}));
    const validation = validateOverrideReason(body.reason);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const overrideReason = body.reason.trim();

    const adminSupabase = createAdminClient();

    // 2. Fetch agent log record
    let logRecord: any = null;

    const { data: dbLog, error: fetchErr } = await adminSupabase
      .from("agent_logs")
      .select(`
        id,
        action,
        listing_id,
        match_id,
        driver_id,
        reasoning,
        confidence,
        overridden_by,
        overridden_at,
        created_at,
        listing:listings (
          id,
          title,
          quantity_kg,
          donor_id,
          donor:profiles!listings_donor_id_fkey (
            email,
            full_name
          )
        ),
        match:matches (
          id,
          shelter_id,
          shelter:shelters (
            name,
            contact_email
          )
        )
      `)
      .eq("id", id)
      .maybeSingle();

    if (!fetchErr && dbLog) {
      logRecord = dbLog;
    } else {
      // Check demo logs fallback
      const demoMatch = DEMO_AGENT_LOGS.find((l) => l.id === id);
      if (demoMatch) {
        logRecord = { ...demoMatch };
      }
    }

    if (!logRecord) {
      return NextResponse.json({ error: `Agent log entry '${id}' not found` }, { status: 404 });
    }

    // 3. Check if override is allowed
    const overrideCheck = canOverrideAction({
      action: logRecord.action,
      overridden_at: logRecord.overridden_at,
    });
    if (!overrideCheck.allowed) {
      return NextResponse.json({ error: overrideCheck.reason }, { status: 400 });
    }

    // 4. Determine and apply reversal plan
    const reversalPlan = determineReversalPlan(logRecord.action);
    const nowIso = new Date().toISOString();

    if (logRecord.action === "AUTO_CONFIRM_SHELTER") {
      // Revert match to cancelled
      if (logRecord.match_id) {
        await adminSupabase
          .from("matches")
          .update({
            status: "cancelled",
            response_notes: `Override: ${overrideReason}`,
            responded_at: nowIso,
          })
          .eq("id", logRecord.match_id);
      }

      // Revert listing to available
      if (logRecord.listing_id) {
        await adminSupabase
          .from("listings")
          .update({
            status: "available",
            updated_at: nowIso,
          })
          .eq("id", logRecord.listing_id);
      }
    } else if (logRecord.action === "ASSIGN_DRIVER") {
      // Cancel driver assignment
      if (logRecord.listing_id) {
        await adminSupabase
          .from("driver_assignments")
          .update({
            status: "cancelled",
            notes: `Admin override: ${overrideReason}`,
          })
          .eq("listing_id", logRecord.listing_id)
          .eq("status", "assigned");

        // Revert listing to matched
        await adminSupabase
          .from("listings")
          .update({
            status: "matched",
            updated_at: nowIso,
          })
          .eq("id", logRecord.listing_id);
      }
    }

    // 5. Update agent_logs record with audit metadata
    const updatedReasoning = `${logRecord.reasoning || ""} | [OVERRIDDEN BY ADMIN: ${overrideReason}]`;
    await adminSupabase
      .from("agent_logs")
      .update({
        overridden_by: adminUserId,
        overridden_at: nowIso,
        reasoning: updatedReasoning,
      })
      .eq("id", id);

    // 6. Queue notification emails to affected parties
    const listingTitle = logRecord.listing?.title || logRecord.listing_title || "Food Listing";
    const shelterEmail = logRecord.match?.shelter?.contact_email;
    const donorEmail = logRecord.listing?.donor?.email;

    try {
      const emailHtml = await renderAgentOverrideAlert({
        actionType: logRecord.action,
        listingTitle,
        listingId: logRecord.listing_id || id,
        reason: overrideReason,
        adminName,
        overriddenAt: new Date(nowIso).toLocaleString("en-IN"),
        recipientRole: logRecord.action === "ASSIGN_DRIVER" ? "driver" : "shelter",
        reversalSummary: reversalPlan.reversalSummary,
      });

      const recipient = shelterEmail || donorEmail || "admin@annasetu.in";
      await queueEmail({
        to: recipient,
        subject: `⚠️ Notice: Autonomous Action ${logRecord.action} Overridden by Admin`,
        html: emailHtml,
        priority: "high",
        metadata: {
          logId: id,
          eventType: "agent_override",
        },
      });
    } catch (emailErr) {
      console.warn("[Agent Override API] Could not queue email notification:", emailErr);
    }

    return NextResponse.json({
      data: {
        success: true,
        message: "Autonomous action successfully overridden and reversed",
        reversal: reversalPlan,
        log: {
          id,
          action: logRecord.action,
          overridden_by: adminUserId,
          overridden_at: nowIso,
          admin_name: adminName,
        },
      },
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[Agent Override API] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

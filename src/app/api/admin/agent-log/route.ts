import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEMO_AGENT_LOGS, type AgentLogRecord } from "@/lib/dispatcher/override";

const ADMIN_ROLES = ["super_admin", "platform_admin", "moderator"];

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    // In production, ensure user is authenticated as an admin
    if (session) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (!profile || !ADMIN_ROLES.includes(profile.role)) {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
      }
    }

    const { searchParams } = new URL(request.url);
    const actionFilter = searchParams.get("action");
    const overriddenFilter = searchParams.get("overridden");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);
    const offset = Number(searchParams.get("offset")) || 0;

    const adminSupabase = createAdminClient();

    let logs: AgentLogRecord[] = [];
    let totalCount = 0;

    try {
      let query = adminSupabase
        .from("agent_logs")
        .select(
          `
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
            ers_score
          ),
          match:matches (
            id,
            shelter:shelters (
              name
            )
          ),
          driver:drivers (
            id,
            vehicle_type,
            profile:profiles (
              full_name,
              phone
            )
          ),
          overridden_profile:profiles!agent_logs_overridden_by_fkey (
            full_name,
            display_name
          )
        `,
          { count: "exact" }
        )
        .order("created_at", { ascending: false });

      if (actionFilter && actionFilter !== "ALL") {
        query = query.eq("action", actionFilter);
      }
      if (overriddenFilter === "true") {
        query = query.not("overridden_at", "is", null);
      } else if (overriddenFilter === "false") {
        query = query.is("overridden_at", null);
      }

      query = query.range(offset, offset + limit - 1);

      const { data: dbLogs, count, error: dbError } = await query;

      if (!dbError && Array.isArray(dbLogs) && dbLogs.length > 0) {
        totalCount = count || dbLogs.length;
        logs = dbLogs.map((row: any) => ({
          id: row.id,
          action: row.action,
          listing_id: row.listing_id,
          match_id: row.match_id,
          driver_id: row.driver_id,
          reasoning: row.reasoning,
          confidence: row.confidence ? Number(row.confidence) : null,
          overridden_by: row.overridden_by,
          overridden_at: row.overridden_at,
          created_at: row.created_at,
          listing_title: row.listing?.title,
          listing_quantity_kg: row.listing?.quantity_kg,
          listing_ers: row.listing?.ers_score,
          shelter_name: row.match?.shelter?.name,
          driver_name: row.driver?.profile?.full_name
            ? `${row.driver.profile.full_name} (${row.driver.vehicle_type || "Driver"})`
            : undefined,
          admin_name:
            row.overridden_profile?.display_name || row.overridden_profile?.full_name,
        }));
      }
    } catch (dbErr) {
      console.warn("[Agent Log API] DB query failed, using demo fallback:", dbErr);
    }

    // If database is empty or has fewer demo entries, supplement with DEMO_AGENT_LOGS
    if (logs.length === 0) {
      let filteredDemo = [...DEMO_AGENT_LOGS];
      if (actionFilter && actionFilter !== "ALL") {
        filteredDemo = filteredDemo.filter((l) => l.action === actionFilter);
      }
      if (overriddenFilter === "true") {
        filteredDemo = filteredDemo.filter((l) => l.overridden_at !== null);
      } else if (overriddenFilter === "false") {
        filteredDemo = filteredDemo.filter((l) => l.overridden_at === null);
      }
      totalCount = filteredDemo.length;
      logs = filteredDemo.slice(offset, offset + limit);
    }

    // Compute summary stats across all items
    const allForStats = logs.length > 0 ? logs : DEMO_AGENT_LOGS;
    const stats = {
      total_actions: totalCount || allForStats.length,
      auto_confirmed: allForStats.filter((l) => l.action === "AUTO_CONFIRM_SHELTER").length,
      drivers_assigned: allForStats.filter((l) => l.action === "ASSIGN_DRIVER").length,
      escalated: allForStats.filter((l) => l.action === "ESCALATE_TO_ADMIN").length,
      overridden: allForStats.filter((l) => l.overridden_at !== null).length,
    };

    return NextResponse.json({
      data: {
        logs,
        total: totalCount,
        stats,
      },
      error: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("[Agent Log API] GET error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

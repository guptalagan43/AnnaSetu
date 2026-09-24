/**
 * GET /api/dispatcher/opt-out?match_id=<id>
 *
 * Allows a shelter to opt out of an auto-confirmed match within the 5-minute
 * window. Reverses the match back to pending and resets the listing to listed.
 * Rules §5: every dispatcher action must be reversible by the shelter within 5 min.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const OPT_OUT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(request: NextRequest): Promise<NextResponse> {
  const matchId = request.nextUrl.searchParams.get("match_id");

  if (!matchId) {
    return NextResponse.json({ error: "match_id is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    // 1. Fetch the match
    const { data: match, error: matchErr } = await supabase
      .from("matches")
      .select("id, listing_id, status, created_at, auto_confirmed")
      .eq("id", matchId)
      .single();

    if (matchErr || !match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // 2. Only auto_confirmed matches can be opted out of
    if (!match.auto_confirmed || match.status !== "auto_confirmed") {
      return NextResponse.json(
        { error: "This match is not eligible for opt-out" },
        { status: 409 }
      );
    }

    // 3. Check 5-minute window
    const createdAt = new Date(match.created_at).getTime();
    const elapsed = Date.now() - createdAt;
    if (elapsed > OPT_OUT_WINDOW_MS) {
      return NextResponse.json(
        {
          error: "Opt-out window has expired (5 minutes). Please contact an admin.",
          elapsed_seconds: Math.round(elapsed / 1000),
        },
        { status: 410 }
      );
    }

    // 4. Reverse: cancel the match, reset listing to listed
    const { error: updateMatchErr } = await supabase
      .from("matches")
      .update({ status: "cancelled" })
      .eq("id", matchId);

    if (updateMatchErr) {
      throw updateMatchErr;
    }

    await supabase
      .from("listings")
      .update({ status: "listed", updated_at: new Date().toISOString() })
      .eq("id", match.listing_id);

    // 5. Log the override to agent_logs
    await supabase.from("agent_logs").insert({
      action: "SHELTER_OPT_OUT",
      listing_id: match.listing_id,
      match_id: matchId,
      reasoning: "Shelter opted out of auto-confirmed match within 5-minute window",
      confidence: 1.0,
    });

    // Return a plain HTML confirmation page (no React needed for this flow)
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Opt-Out Confirmed — AnnaSetu</title>
  <style>
    body { background: #F5F0E8; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; font-family: system-ui, sans-serif; }
    .card { background: #fff; border: 3px solid #0A0A0A; box-shadow: 6px 6px 0 #0A0A0A; padding: 40px; max-width: 480px; width: 100%; }
    h1 { font-family: 'Arial Black', sans-serif; font-size: 28px; margin: 0 0 16px; color: #0A0A0A; }
    p { font-size: 15px; color: #1A1A1A; line-height: 1.6; margin: 0 0 16px; }
    .label { font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: #666; margin: 0 0 4px; }
  </style>
</head>
<body>
  <div class="card">
    <p class="label">✅ ACTION CONFIRMED</p>
    <h1>OPT-OUT SUCCESSFUL</h1>
    <p>You have successfully opted out of the auto-confirmed food rescue match. The listing has been reset and will be re-matched to another available shelter.</p>
    <p>You can close this window.</p>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[DispatcherOptOut] Error:", message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

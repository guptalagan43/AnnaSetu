import { NextRequest, NextResponse } from "next/server";
import { recalculateAllERS } from "@/lib/queue/workers/ers";
import { runDispatcherAgent } from "@/lib/dispatcher/agent";
import { runWeeklyDigest } from "@/lib/queue/workers/digest";

const CRON_SECRET = process.env.CRON_SECRET;

async function verifyCronRequest(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get("authorization");
  const cronSecret =
    request.nextUrl.searchParams.get("secret") ||
    request.headers.get("x-cron-secret");

  // If CRON_SECRET is configured, enforce it via header or query param
  if (CRON_SECRET && cronSecret !== CRON_SECRET) {
    return false;
  }

  // Also accept Vercel-style Bearer header
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return false;
  }

  return true;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const job = request.nextUrl.searchParams.get("job");

  if (!CRON_SECRET) {
    console.warn("[CRON] CRON_SECRET not set — running without auth check");
  } else {
    const verified = await verifyCronRequest(request);
    if (!verified) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    switch (job) {
      case "ers": {
        const ersResult = await recalculateAllERS();
        return NextResponse.json(ersResult);
      }

      case "dispatcher": {
        const dispatcherResult = await runDispatcherAgent();
        return NextResponse.json(dispatcherResult);
      }

      case "digest": {
        const digestResult = await runWeeklyDigest();
        return NextResponse.json(digestResult);
      }

      default:
        return NextResponse.json({ error: "Invalid job parameter" }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[CRON] Unexpected error:", message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
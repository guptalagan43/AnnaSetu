import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAuthToken } from "@/lib/auth/localStore";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token =
      cookieStore.get("sb-access-token")?.value ||
      cookieStore.get("annasetu-token")?.value;

    // 1. Check local JWT token first
    if (token) {
      const decoded = verifyAuthToken(token);
      if (decoded) {
        return NextResponse.json({
          user: {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
            display_name: decoded.display_name || decoded.email.split("@")[0],
          },
        });
      }
    }

    // 2. Try Supabase SSR if configured
    const hasSupabase = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
    );

    if (hasSupabase) {
      try {
        const { createClient } = await import("@/lib/supabase/server");
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, display_name")
            .eq("id", session.user.id)
            .single();

          return NextResponse.json({
            user: {
              id: session.user.id,
              email: session.user.email,
              role: profile?.role || "donor_staff",
              display_name: profile?.display_name || session.user.email?.split("@")[0] || "User",
            },
          });
        }
      } catch (sbErr) {
        console.warn("[Auth Me] Supabase session fetch failed:", sbErr);
      }
    }

    return NextResponse.json({ user: null }, { status: 401 });
  } catch (error) {
    console.error("[Auth Me] Error:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}